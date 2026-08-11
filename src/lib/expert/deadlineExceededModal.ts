/**
 * Controls when ExpertDeadlineExceededModal should open.
 *
 * Opens whenever the request is currently expired — including History opens
 * where expiry was already true on first load. Closing is only via explicit
 * Go Back; remounting the page (reopen / refresh) shows the modal again.
 */
export function shouldOpenDeadlineExceededModal(
  deadlineExceeded: boolean,
): boolean {
  return deadlineExceeded;
}
