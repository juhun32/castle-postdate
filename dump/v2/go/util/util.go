package util

type StringSlice []string

func Contains(slice []string, s string) bool {
	for _, v := range slice {
		if v == s {
			return true
		}
	}

	return false
}

// remove returns a new slice without the target string
func Remove(slice []string, s string) []string {
	out := []string{}
	for _, v := range slice {
		if v != s {
			out = append(out, v)
		}
	}
	return out
}

// convert interface slice to []string
func ToStringSlice(i interface{}) []string {
	arr, ok := i.([]interface{})

	if !ok {
		return nil
	}

	out := make([]string, len(arr))
	for idx, val := range arr {
		out[idx] = val.(string)
	}

	return out
}

// check valid email format
func IsValidEmail(email string) bool {
	if len(email) < 3 || len(email) > 254 {
		return false
	}

	at := -1

	for i, c := range email {
		if c == '@' {
			if at != -1 {
				// multiple '@' characters
				return false
			}
			at = i
		} else if c == '.' && at != -1 && i > at+1 && i < len(email)-1 {
			// valid domain part after '@'
			return true
		}
	}

	// no valid domain part found
	return false
}

// getStringValue safely extracts a string value from a map, returning empty string if not found or nil
func GetStringValue(data map[string]interface{}, key string) string {
	if val, exists := data[key]; exists && val != nil {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// getMapKeys returns a slice of keys from a map
func GetMapKeys(data map[string]interface{}) []string {
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	return keys
}
