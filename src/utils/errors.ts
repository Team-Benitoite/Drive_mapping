/** catch で受け取った値からユーザー向けのメッセージを取り出します。 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
