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

use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Neos\Domain\Service\NodeSearchServiceInterface;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Neos\Neos\Service\LinkingService;
use Shel\Neos\CommandBar\Helper\TranslationHelper;

class SearchNodesDataSource extends AbstractDataSource
{

    static protected $identifier = 'shel-neos-commandbar-search-nodes';
    #[\Neos\Flow\Annotations\Inject]
    protected \Neos\ContentRepositoryRegistry\ContentRepositoryRegistry $contentRepositoryRegistry;
    #[\Neos\Flow\Annotations\Inject]
    protected \Neos\Neos\Domain\NodeLabel\NodeLabelGeneratorInterface $nodeLabelGenerator;

    public function __construct(
        private readonly NodeSearchServiceInterface $nodeSearchService,
        private readonly LinkingService $linkingService
    ) {
    }

    public function getData(\Neos\ContentRepository\Core\Projection\ContentGraph\Node $node = null, array $arguments = []): array
    {
        $query = $arguments['query'] ?? '';

        if (!$node || !$query) {
            return [];
        }
        // TODO 9.0 migration: This could be a suitable replacement. Please check if all your requirements are still fulfilled.
        $subgraph = $this->contentRepositoryRegistry->subgraphForNode($node);

        $matchingNodes = $subgraph->findDescendantNodes($node->aggregateId, \Neos\ContentRepository\Core\Projection\ContentGraph\Filter\FindDescendantNodesFilter::create(nodeTypes: \Neos\ContentRepository\Core\Projection\ContentGraph\Filter\NodeType\NodeTypeCriteria::create(\Neos\ContentRepository\Core\NodeType\NodeTypeNames::fromStringArray([
            'Neos.Neos:Document',
            'Neos.Neos:Shortcut',
        ]), \Neos\ContentRepository\Core\NodeType\NodeTypeNames::createEmpty()), searchTerm: $query));

        return array_values(array_filter(array_map(function (\Neos\ContentRepository\Core\Projection\ContentGraph\Node $matchingNode) {
            $contentRepository = $this->contentRepositoryRegistry->get($matchingNode->contentRepositoryId);
            $contentRepository = $this->contentRepositoryRegistry->get($matchingNode->contentRepositoryId);
            return [
                'name' => $this->nodeLabelGenerator->getLabel($matchingNode),
                'nodetype' => TranslationHelper::translateByShortHandString($contentRepository->getNodeTypeManager()->getNodeType($matchingNode->nodeTypeName)->getLabel()),
                'contextPath' => \Neos\ContentRepository\Core\SharedModel\Node\NodeAddress::fromNode($matchingNode)->toJson(),
                'icon' => $contentRepository->getNodeTypeManager()->getNodeType($matchingNode->nodeTypeName)->getFullConfiguration()['ui']['icon'] ?? 'file',
                'uri' => $this->getNodeUri($matchingNode),
            ];
        }, $matchingNodes), static fn($item) => $item['uri']));
    }

    protected function getNodeUri(\Neos\ContentRepository\Core\Projection\ContentGraph\Node $node): string
    {
        try {
            return $this->linkingService->createNodeUri($this->controllerContext, $node, null, 'html', true);
        } catch (\Exception $e) {
            return '';
        }
    }
}
