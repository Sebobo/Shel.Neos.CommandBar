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
use Neos\Flow\Annotations as Flow;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\View\JsonView;
use Neos\Neos\Domain\Model\UserPreferences;
use Neos\Neos\Service\UserService;

class PreferencesController extends ActionController
{
    protected const FAVOURITES_PREFERENCE = 'commandBar.favourites';
    protected const RECENT_COMMANDS_PREFERENCE = 'commandBar.recentCommands';
    protected const RECENT_DOCUMENTS_PREFERENCE = 'commandBar.recentDocuments';
    protected $defaultViewObjectName = JsonView::class;
    protected $supportedMediaTypes = ['application/json'];

    public function __construct(protected UserService $userService, protected EntityManagerInterface $entityManager)
    {
    }

    public function getPreferencesAction(): void
    {
        $preferences = $this->getUserPreferences();
        $this->view->assign('value', [
            'favouriteCommands' => $preferences->get(self::FAVOURITES_PREFERENCE) ?? [],
            'recentCommands' => $preferences->get(self::RECENT_COMMANDS_PREFERENCE) ?? [],
            'recentDocuments' => $preferences->get(self::RECENT_DOCUMENTS_PREFERENCE)?? [],
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
    public function setRecentCommandsAction(array $commandIds): void
    {
        $preferences = $this->getUserPreferences();
        $preferences->set(self::RECENT_COMMANDS_PREFERENCE, $commandIds);
        $this->entityManager->persist($preferences);
        $this->view->assign('value', $commandIds);
    }

    /**
     * Updates the list of recently used documents in the user preferences
     *
     * @Flow\SkipCsrfProtection
     * @param string[] $nodeContextPaths a list of context paths to uniquely define nodes
     */
    public function setRecentDocumentsAction(array $nodeContextPaths): void
    {
        $preferences = $this->getUserPreferences();
        $preferences->set(self::RECENT_DOCUMENTS_PREFERENCE, $nodeContextPaths);
        $this->entityManager->persist($preferences);
        $this->view->assign('value', $nodeContextPaths);
    }

    protected function getUserPreferences(): UserPreferences
    {
        $user = $this->userService->getBackendUser();
        if (!$user) {
            throw new \RuntimeException('No user found', 1676812156);
        }
        return $user->getPreferences();
    }

}
