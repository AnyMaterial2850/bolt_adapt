// Generate a CSRF token
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2);
}

// Validate a CSRF token
export function validateCSRFToken(token: string): boolean {
  // In a real app, validate against server-stored token
  return !!token;
}

// Add CSRF token to form data
export function addCSRFToken(formData: FormData): FormData {
  formData.append('csrf_token', generateCSRFToken());
  return formData;
}