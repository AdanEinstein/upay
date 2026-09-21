<?php

namespace App\Enums;

enum NoticeType: string
{
    case Info = 'info';
    case Warning = 'warning';
    case Urgent = 'urgent';
}
