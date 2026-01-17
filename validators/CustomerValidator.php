<?php

class CustomerValidator
{
    public static function validate(array $data, $isUpdate = false)
    {
        // Required
        if (empty($data['customer_code']) && !$isUpdate) {
            return "Customer code is required";
        }

        if (empty($data['first_name']) || empty($data['last_name'])) {
            return "First name and last name are required";
        }

        // Gender
        $allowedGender = ['Male', 'Female', 'Unspecified'];
        if (isset($data['gender']) && !in_array($data['gender'], $allowedGender)) {
            return "Invalid gender value";
        }

        // Date of birth - REQUIRED
        if (empty($data['date_of_birth'])) {
            return "Date of birth is required";
        }

        // National ID - REQUIRED
        if (empty($data['national_id'])) {
            return "National ID is required";
        }

        // Validate date
        if (strtotime($data['date_of_birth']) > time()) {
            return "Date of birth cannot be in the future";
        }

        // Validate National ID (13 digits)
        if (!preg_match('/^\d{13}$/', $data['national_id'])) {
            return "National ID must be 13 digits";
        }

        // Status - REQUIRED
        if (empty($data['status_id'])) {
            return "Status is required";
        }

        // Length
        if (!empty($data['customer_code']) && strlen($data['customer_code']) > 20) {
            return "Customer code too long";
        }

        return null; // ✅ ผ่านทั้งหมด
    }
}
