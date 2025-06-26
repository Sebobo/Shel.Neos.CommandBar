<?php

declare(strict_types=1);

namespace Shel\Neos\CommandBar\Helper;

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\Flow\Annotations as Flow;
use Neos\Flow\I18n\EelHelper\TranslationParameterToken;

#[Flow\Proxy(false)]
final class TranslationHelper
{
    public static function translateByShortHandString(string $shortHandString): string
    {
        $shortHandStringParts = explode(':', $shortHandString);
        if (count($shortHandStringParts) === 3) {
            [$package, $source, $id] = $shortHandStringParts;
            try {
                return (new TranslationParameterToken($id))
                    ->package($package)
                    ->source(str_replace('.', '/', $source))
                    ->translate();
            } catch (\Exception) {
                return $shortHandString; // Fallback to original string if translation fails
            }
        }
        return $shortHandString;
    }
}
