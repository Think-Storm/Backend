/**
 * Enveloop hosted these templates server-side and they were sent by name.
 * Resend has no hosted-template equivalent for transactional sends, so the
 * markup lives here and the former templateVariables are now arguments.
 */

/**
 * Values below are user-controlled (usernames, project names), and they are
 * interpolated straight into markup — escape them so a display name cannot
 * inject markup into the delivered email.
 */
const escapeHtml = (value: string): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (heading: string, body: string): string => `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${heading}</h1>
          ${body}
          <p style="margin:32px 0 0;font-size:12px;color:#6b7280;">ThinkStorm</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const welcomeEmail = (name: string): string =>
  layout(
    `Welcome to ThinkStorm, ${escapeHtml(name)}`,
    `<p style="margin:0;font-size:14px;line-height:1.6;">Your account is ready. Head over to ThinkStorm to set up your profile and find a project to join.</p>`,
  );

export const forgotPasswordEmail = (name: string, resetUrl: string): string =>
  layout(
    'Reset your password',
    `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Hi ${escapeHtml(
      name,
    )}, we received a request to reset your ThinkStorm password. This link expires in 15 minutes.</p>
     <p style="margin:0 0 20px;"><a href="${encodeURI(
       resetUrl,
     )}" style="display:inline-block;padding:10px 18px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">Reset password</a></p>
     <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">If you did not request this, you can ignore this email and your password will stay unchanged.</p>`,
  );

export const joinRequestAcceptedEmail = (
  projectName: string,
  projectOwner: string,
): string =>
  layout(
    'Your join request was accepted',
    `<p style="margin:0;font-size:14px;line-height:1.6;">${escapeHtml(
      projectOwner,
    )} accepted your request to join <strong>${escapeHtml(
      projectName,
    )}</strong>. You can now collaborate with the team on ThinkStorm.</p>`,
  );

export const joinRequestDeclinedEmail = (
  projectName: string,
  projectOwner: string,
): string =>
  layout(
    'Your join request was declined',
    `<p style="margin:0;font-size:14px;line-height:1.6;">${escapeHtml(
      projectOwner,
    )} declined your request to join <strong>${escapeHtml(
      projectName,
    )}</strong>. There are plenty of other projects looking for collaborators.</p>`,
  );
