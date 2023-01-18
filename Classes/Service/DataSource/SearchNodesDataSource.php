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
use Neos\Flow\I18n\EelHelper\TranslationParameterToken;
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

        return array_map(function (NodeInterface $matchingNode) {
            return [
                'name' => $matchingNode->getLabel(),
                'nodetype' => $this->translateByShortHandString($matchingNode->getNodeType()->getLabel()),
                'contextPath' => $matchingNode->getContextPath(),
                'icon' => $matchingNode->getNodeType()->getFullConfiguration()['ui']['icon'] ?? 'file',
                'uri' => $this->getNodeUri($matchingNode),
            ];
        }, array_values($matchingNodes));
    }

    protected function getNodeUri(NodeInterface $node): string
    {
        try {
            return $this->linkingService->createNodeUri($this->controllerContext, $node, null, 'html', true);
        } catch (\Exception $e) {
            return '';
        }
    }

    // FIXME: Using the TranslationHelper instead throws class not found error, why?
    public function translateByShortHandString(string $shortHandString): string
    {
        $shortHandStringParts = explode(':', $shortHandString);
        if (count($shortHandStringParts) === 3) {
            [$package, $source, $id] = $shortHandStringParts;
            return (new TranslationParameterToken($id))
                ->package($package)
                ->source(str_replace('.', '/', $source))
                ->translate();
        }

        return $shortHandString;
    }
}
