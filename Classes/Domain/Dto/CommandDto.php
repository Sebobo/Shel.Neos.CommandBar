<?php

declare(strict_types=1);

namespace Shel\Neos\CommandBar\Domain\Dto;

/*
 * This script belongs to the Neos CMS package "Shel.Neos.CommandBar".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\Flow\Annotations as Flow;

#[Flow\Proxy(false)]
readonly class CommandDto implements \JsonSerializable
{

    public function __construct(
        public string $id,
        public string $name,
        public string $description,
        public string $action,
        public string $icon,
        public string $category = '',
    ) {
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'action' => $this->action,
            'icon' => $this->icon,
            'category' => $this->category,
        ];
    }
}
