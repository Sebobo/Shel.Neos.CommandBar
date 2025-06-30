<?php

declare(strict_types=1);

namespace Shel\Neos\CommandBar\Controller;

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Doctrine\ORM\EntityManagerInterface;
use Neos\ContentRepository\Core\Feature\Security\Exception\AccessDenied;
use Neos\ContentRepository\Core\Projection\ContentGraph\Node;
use Neos\ContentRepository\Core\SharedModel\Node\NodeAddress;
use Neos\ContentRepositoryRegistry\ContentRepositoryRegistry;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\View\JsonView;
use Neos\Neos\Domain\Model\UserPreferences;
use Neos\Neos\Domain\NodeLabel\NodeLabelGeneratorInterface;
use Neos\Neos\Service\LinkingService;
use Neos\Neos\Service\UserService;

class PreferencesController extends ActionController
{
    protected const FAVOURITES_PREFERENCE = 'commandBar.favourites';
    protected const RECENT_COMMANDS_PREFERENCE = 'commandBar.recentCommands';
    protected const RECENT_DOCUMENTS_PREFERENCE = 'commandBar.recentDocuments';
    protected $defaultViewObjectName = JsonView::class;
    protected $supportedMediaTypes = ['application/json'];

    public function __construct(
        protected UserService $userService,
        protected EntityManagerInterface $entityManager,
        protected LinkingService $linkingService,
        protected ContentRepositoryRegistry $contentRepositoryRegistry,
        protected NodeLabelGeneratorInterface $nodeLabelGenerator,
    ) {
    }

    public function getPreferencesAction(): void
    {
        $preferences = $this->getUserPreferences();
        $this->view->assign('value', [
            'favouriteCommands' => $preferences->get(self::FAVOURITES_PREFERENCE) ?? [],
            'recentCommands' => $preferences->get(self::RECENT_COMMANDS_PREFERENCE) ?? [],
            'recentDocuments' => $this->mapContextPathsToNodes(
                $preferences->get(self::RECENT_DOCUMENTS_PREFERENCE) ?? []
            ),
            'showBranding' => $this->settings['features']['showBranding'],
        ]);
    }

    /**
     * Updates the list of favourite commands in the user preferences
     *
     * @Flow\SkipCsrfProtection
     */
    public function setFavouritesAction(array $commandIds): void
    {
        $preferences = $this->getUserPreferences();
        $preferences->set(self::FAVOURITES_PREFERENCE, $commandIds);
        $this->entityManager->persist($preferences);
        $this->view->assign('value', $commandIds);
    }

    /**
     * Updates the list of recently used commands in the user preferences
     *
     * @Flow\SkipCsrfProtection
     */
    public function addRecentCommandAction(string $commandId): void
    {
        $preferences = $this->getUserPreferences();
        $recentCommands = $preferences->get(self::RECENT_COMMANDS_PREFERENCE);
        if ($recentCommands === null) {
            $recentCommands = [];
        }

        // Remove the command from the list if it is already in there (to move it to the top)
        $recentCommands = array_filter($recentCommands, static fn($id) => $id !== $commandId);
        // Add the command to the top of the list
        array_unshift($recentCommands, $commandId);
        // Limit the list to 5 items
        $recentCommands = array_slice($recentCommands, 0, 5);

        // Save the list
        $preferences->set(self::RECENT_COMMANDS_PREFERENCE, $recentCommands);
        $this->entityManager->persist($preferences);
        $this->view->assign('value', $recentCommands);
    }

    /**
     * Updates the list of recently used documents in the user preferences
     *
     * @param string $nodeContextPath a node to add to the recently visited documents
     * @Flow\SkipCsrfProtection
     */
    public function addRecentDocumentAction(string $nodeContextPath): void
    {
        $preferences = $this->getUserPreferences();

        /** @var string[]|null $recentDocuments */
        $recentDocuments = $preferences->get(self::RECENT_DOCUMENTS_PREFERENCE);
        if ($recentDocuments === null) {
            $recentDocuments = [];
        }

        // Remove the command from the list if it is already in there (to move it to the top)
        $recentDocuments = array_filter(
            $recentDocuments,
            static fn($existingContextPath) => $existingContextPath !== $nodeContextPath
        );

        try {
            // Try to create a NodeAddress from the context path
            NodeAddress::fromJsonString($nodeContextPath);

            // Add the path to the top of the list
            array_unshift($recentDocuments, $nodeContextPath);

            // Limit the list to 5 items
            $recentDocuments = array_slice($recentDocuments, 0, 5);
        } catch (\InvalidArgumentException $e) {
            // If the context path is not a valid NodeAddress, we skip this action
        }

        // Save the list
        $preferences->set(self::RECENT_DOCUMENTS_PREFERENCE, $recentDocuments);
        $this->entityManager->persist($preferences);
        $this->view->assign('value', $this->mapContextPathsToNodes($recentDocuments));
    }

    protected function getUserPreferences(): UserPreferences
    {
        $user = $this->userService->getBackendUser();
        if (!$user) {
            throw new \RuntimeException('No user found', 1676812156);
        }
        return $user->getPreferences();
    }

    /**
     * @param string[] $nodeContextPaths
     */
    protected function mapContextPathsToNodes(
        array $nodeContextPaths,
    ): array {
        return array_filter(
            array_map(function (string $nodeContextPath) {
                try {
                    $nodeAddress = NodeAddress::fromJsonString($nodeContextPath);
                } catch (\InvalidArgumentException) {
                    // If the context path is not a valid NodeAddress, we skip this node
                    return null;
                }

                $contentRepository = $this->contentRepositoryRegistry->get($nodeAddress->contentRepositoryId);
                try {
                    $subgraph = $contentRepository->getContentSubgraph(
                        $nodeAddress->workspaceName,
                        $nodeAddress->dimensionSpacePoint
                    );
                } catch (AccessDenied) {
                    // If the user does not have access to the subgraph, we skip this node
                    return null;
                }

                $node = $subgraph->findNodeById($nodeAddress->aggregateId);
                if (!$node) {
                    return null;
                }

                $uri = $this->getNodeUri($node);
                if (!$uri) {
                    return null;
                }

                $nodeType = $contentRepository->getNodeTypeManager()->getNodeType($node->nodeTypeName);
                return [
                    'name' => $this->nodeLabelGenerator->getLabel($node),
                    'icon' => $nodeType?->getConfiguration('ui.icon') ?? 'question',
                    'uri' => $this->getNodeUri($node),
                    'contextPath' => $nodeContextPath,
                ];
            }, $nodeContextPaths)
        );
    }

    protected function getNodeUri(Node $node): string
    {
        try {
            return $this->linkingService->createNodeUri($this->controllerContext, $node, null, 'html', true);
        } catch (\Exception) {
            return '';
        }
    }

}
