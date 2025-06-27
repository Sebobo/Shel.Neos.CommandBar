<?php

declare(strict_types=1);

namespace Shel\Neos\CommandBar\Service\DataSource;

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\ContentRepository\Core\NodeType\NodeTypeNames;
use Neos\ContentRepository\Core\Projection\ContentGraph\Filter\FindDescendantNodesFilter;
use Neos\ContentRepository\Core\Projection\ContentGraph\Filter\NodeType\NodeTypeCriteria;
use Neos\ContentRepository\Core\Projection\ContentGraph\Node;
use Neos\ContentRepository\Core\SharedModel\Node\NodeAddress;
use Neos\ContentRepositoryRegistry\ContentRepositoryRegistry;
use Neos\Neos\Domain\NodeLabel\NodeLabelGeneratorInterface;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Neos\Neos\Service\LinkingService;
use Shel\Neos\CommandBar\Helper\TranslationHelper;

class SearchNodesDataSource extends AbstractDataSource
{
    static protected $identifier = 'shel-neos-commandbar-search-nodes';

    public function __construct(
        private readonly LinkingService $linkingService,
        private readonly ContentRepositoryRegistry $contentRepositoryRegistry,
        private readonly NodeLabelGeneratorInterface $nodeLabelGenerator,
    ) {
    }

    public function getData(
        ?Node $node = null,
        array $arguments = []
    ): array {
        $query = $arguments['query'] ?? '';

        if (!$node || !$query) {
            return [];
        }
        $subgraph = $this->contentRepositoryRegistry->subgraphForNode($node);
        $contentRepository = $this->contentRepositoryRegistry->get($node->contentRepositoryId);

        $matchingNodes = $subgraph->findDescendantNodes(
            $node->aggregateId,
            FindDescendantNodesFilter::create(
                NodeTypeCriteria::createWithAllowedNodeTypeNames(
                    NodeTypeNames::fromStringArray([
                        'Neos.Neos:Document',
                        'Neos.Neos:Shortcut',
                    ])
                ),
                searchTerm: $query
            )
        );

        return array_values(
            array_filter(
                $matchingNodes->map(function (Node $matchingNode) use ($contentRepository) {
                    return [
                        'name' => $this->nodeLabelGenerator->getLabel($matchingNode),
                        'nodetype' => TranslationHelper::translateByShortHandString(
                            $contentRepository->getNodeTypeManager()->getNodeType(
                                $matchingNode->nodeTypeName
                            )?->getLabel()
                        ),
                        'contextPath' => NodeAddress::fromNode(
                            $matchingNode
                        )->toJson(),
                        'icon' => $contentRepository->getNodeTypeManager()->getNodeType(
                                $matchingNode->nodeTypeName
                            )?->getFullConfiguration()['ui']['icon'] ?? 'file',
                        'uri' => $this->getNodeUri($matchingNode),
                    ];
                }),
                static fn($item) => $item['uri']
            )
        );
    }

    protected function getNodeUri(Node $node): string
    {
        try {
            return $this->linkingService->createNodeUri(
                $this->controllerContext,
                $node,
                null,
                'html',
                true
            );
        } catch (\Exception) {
            return '';
        }
    }
}
