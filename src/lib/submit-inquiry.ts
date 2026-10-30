export type InquiryResult = { ok: true } | { ok: false; message: string };

/** A successful HTTP response is not sufficient: require provider acknowledgement. */
export async function submitInquiry(endpoint: string, data: FormData, signal: AbortSignal): Promise<InquiryResult> {
  try {
    const response = await fetch(endpoint, {
      method: "POST", body: data, headers: { Accept: "application/json" }, signal,
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.ok === true) return { ok: true };
    if (response.status === 429) return { ok: false, message: "The form is receiving too many requests. Please wait a few minutes before trying again, or email me directly. Your message is still here." };
    if (response.status === 422 || response.status === 400) return { ok: false, message: "The form service could not accept this inquiry. Check your email address and message, then try again. If the problem continues, email me directly. Your message is still here." };
    return { ok: false, message: "Sending could not be confirmed. Your message is still here. Please try again later or use the email link below." };
  } catch {
    return { ok: false, message: "Sending could not be confirmed because the connection was interrupted or timed out. Your message is still here. Check your connection, or email me directly. Retrying may send a duplicate if the first request arrived." };
  }
}
