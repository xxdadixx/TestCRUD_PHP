<?php

function formatNationalId(string $id): string
{
    $id = preg_replace('/\D/', '', $id);

    if (strlen($id) !== 13) {
        return $id;
    }

    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($id, 0, 1),
        substr($id, 1, 4),
        substr($id, 5, 5),
        substr($id, 10, 2),
        substr($id, 12, 1)
    );
}
