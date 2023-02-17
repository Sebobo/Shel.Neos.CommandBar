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

use Neos\Flow\Annotations as Flow;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\View\JsonView;
use Neos\Neos\Service\UserService;

class PreferencesController extends ActionController
{
    protected const FAVOURITES_PREFERENCE = 'commandBar.favourites';
    protected const RECENT_PREFERENCE = 'commandBar.recent';
    protected const MAX_RECENT_ITEMS = 5;
    protected $defaultViewObjectName = JsonView::class;

    /**
     * @var UserService
     */
    #[Flow\Inject]
    protected $userService;

    /**
     * This action adds the given command to the favourites list stored in the users preferences.
     */
    public function addFavouriteAction(string $commandId): void
    {
        $user = $this->userService->getBackendUser();

        if (!$user) {
            $this->view->assign('success', false);
            return;
        }

        $preferences = $user->getPreferences();
        $favourites = $preferences->get(self::FAVOURITES_PREFERENCE) ?? [];
        $favourites[] = $commandId;

        $this->view->assignMultiple([
            'success' => true,
            'favourites' => $favourites,
        ]);
    }

    /**
     * This action removes the given command from the favourites list stored in the users preferences.
     */
    public function removeFavouriteAction(string $commandId): void
    {
        $user = $this->userService->getBackendUser();

        if (!$user) {
            $this->view->assign('success', false);
            return;
        }

        $preferences = $user->getPreferences();
        $favourites = $preferences->get(self::FAVOURITES_PREFERENCE) ?? [];
        $favourites = array_diff($favourites, [$commandId]);

        $this->view->assignMultiple([
            'success' => true,
            'favourites' => $favourites,
        ]);
    }

    /**
     * This action prepends the given command to the recent commands list stored
     * in the users preferences. If the command is already in the list, it is moved to the top.
     * The list is limited to a maximum of MAX_RECENT_ITEMS items.
     */
    public function addRecentAction(string $commandId): void
    {
        $user = $this->userService->getBackendUser();

        if (!$user) {
            $this->view->assign('success', false);
            return;
        }

        $preferences = $user->getPreferences();
        $recent = $preferences->get(self::RECENT_PREFERENCE) ?? [];
        array_unshift($recent, $commandId);
        $recent = array_slice(array_unique($recent), 0, self::MAX_RECENT_ITEMS);

        $this->view->assignMultiple([
            'success' => true,
            'recent' => $recent,
        ]);
    }

}
