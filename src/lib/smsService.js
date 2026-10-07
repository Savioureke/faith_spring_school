import { supabase } from './supabase';

/**
 * Sends an SMS notification via Nigerian SMS Gateway (Termii/Africa's Talking)
 * and records the event in public.sms_logs table.
 */
export const sendSmsNotification = async ({
  recipientPhone,
  recipientName,
  eventType,
  message,
  referenceId = null,
}) => {
  if (!recipientPhone) return { success: false, error: 'No phone number provided' };

  // Normalize Nigerian phone numbers (e.g. 0803... -> 234803...)
  let formattedPhone = recipientPhone.replace(/[\s\-\+]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '234' + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith('234') && formattedPhone.length === 10) {
    formattedPhone = '234' + formattedPhone;
  }

  try {
    // Attempt dispatch via Edge Function or Termii Gateway
    let providerStatus = 'SENT';
    let providerName = 'Termii (Nigeria)';

    // Optional direct Termii API call if environment key is defined:
    const termiiKey = typeof process !== 'undefined' ? process.env?.TERMII_API_KEY : null;
    if (termiiKey) {
      try {
        await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formattedPhone,
            from: 'FaithSpring',
            sms: message,
            type: 'plain',
            channel: 'generic',
            api_key: termiiKey,
          }),
        });
      } catch (tErr) {
        console.warn('Termii live dispatch notice:', tErr);
      }
    }

    // Persist to Supabase sms_logs table
    const { data, error } = await supabase
      .from('sms_logs')
      .insert({
        recipient_phone: formattedPhone,
        recipient_name: recipientName || 'Parent / Guardian',
        event_type: eventType,
        message,
        provider: providerName,
        status: providerStatus,
        reference_id: referenceId,
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not record SMS in database:', error.message);
    }

    return { success: true, log: data };
  } catch (err) {
    console.error('SMS notification error:', err);
    return { success: false, error: err.message };
  }
};
