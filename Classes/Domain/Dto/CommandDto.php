<?php

declare(strict_types=1);

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

namespace Shel\Neos\CommandBar\Domain\Dto;

use Neos\Flow\Annotations as Flow;

#[Flow\Proxy(false)]
class CommandDto implements \JsonSerializable
{

    public function __construct(
        public readonly string $name,
        public readonly string $description,
        public readonly string $action,
        public readonly string $icon,
    ) {
    }

    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'action' => $this->action,
            'icon' => $this->icon,
        ];
    }
}
