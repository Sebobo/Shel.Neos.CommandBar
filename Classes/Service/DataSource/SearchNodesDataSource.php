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

    public function __construct(
        private readonly NodeSearchServiceInterface $nodeSearchService,
        private readonly LinkingService $linkingService
    ) {
    }

    public function getData(NodeInterface $node = null, array $arguments = []): array
    {
        $query = $arguments['query'] ?? '';

        if (!$node || !$query) {
            return [];
        }

        $matchingNodes = $this->nodeSearchService->findByProperties($query, [
            'Neos.Neos:Document',
            'Neos.Neos:Shortcut',
        ], $node->getContext(), $node);

        return array_values(array_filter(array_map(function (NodeInterface $matchingNode) {
            return [
                'name' => $matchingNode->getLabel(),
                'nodetype' => TranslationHelper::translateByShortHandString($matchingNode->getNodeType()->getLabel()),
                'contextPath' => $matchingNode->getContextPath(),
                'icon' => $matchingNode->getNodeType()->getFullConfiguration()['ui']['icon'] ?? 'file',
                'uri' => $this->getNodeUri($matchingNode),
            ];
        }, $matchingNodes), static fn($item) => $item['uri']));
    }

    protected function getNodeUri(NodeInterface $node): string
    {
        try {
            return $this->linkingService->createNodeUri($this->controllerContext, $node, null, 'html', true);
        } catch (\Exception $e) {
            return '';
        }
    }
}
