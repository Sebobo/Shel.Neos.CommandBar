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
use Neos\Neos\Controller\Backend\MenuHelper;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Shel\Neos\CommandBar\Domain\Dto\CommandDto;

class CommandBarDataSource extends AbstractDataSource
{

    static protected $identifier = 'shel-neos-commandbar';

    public function __construct(private readonly MenuHelper $menuHelper)
    {
    }

    public function getData(NodeInterface $node = null, array $arguments = []): array
    {
        $sitesForMenu = array_reduce($this->menuHelper->buildSiteList($this->controllerContext),
            static function (array $carry, array $site) {
                // Skip the currently active site
                if (!$site['active']) {
                    // FIXME: For some reason the DTO class cannot be found and an exception is thrown, sad
//                    $carry[$site['nodeName']] = new CommandDto($site['name'], '', $site['uri'], 'globe');
                    $carry[$site['nodeName']] = [
                        'name' => $site['name'],
                        'description' => '',
                        'action' => $site['uri'],
                        'icon' => 'globe',
                    ];
                }
                return $carry;
            }, []);

        $modulesForMenu = array_reduce($this->menuHelper->buildModuleList($this->controllerContext),
            static function (array $carry, array $module) {
                // Skip hidden or modules without submodules
                if (!$module['submodules'] || $module['hideInMenu']) {
                    return $carry;
                }
                $carry[$module['group']] = [
                    'name' => self::translateByShortHandString($module['label']),
                    'description' => self::translateByShortHandString($module['description']),
                    'icon' => $module['icon'],
                    'subCommands' => array_reduce($module['submodules'], static function (array $carry, array $submodule) {
                        if ($submodule['hideInMenu']) {
                            return $carry;
                        }
                        $carry[$submodule['module']] = [
                            'name' => self::translateByShortHandString($submodule['label']),
                            'description' => self::translateByShortHandString($submodule['description']),
                            'icon' => $submodule['icon'],
                            'action' => $submodule['modulePath'],
                        ];
                        return $carry;
                    }, []),
                ];
                return $carry;
            }, []);

        return [
            'sites' => [
                'name' => 'Sites',
                'description' => 'Switch to another site',
                'icon' => 'file',
                'subCommands' => $sitesForMenu,
            ],
            'modules' => [
                'name' => 'Modules',
                'description' => 'Open a backend module',
                'icon' => 'puzzle-piece',
                'subCommands' => $modulesForMenu,
            ],
        ];
    }

    protected static function translateByShortHandString(string $shortHandString): string
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
