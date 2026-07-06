import emailjs from '@emailjs/browser';
import { EMAIL_TEMPLATES } from '../constants/emailTemplates';

// Module-level EmailJS config debug logs
console.log("[EmailJS Config Debug] Service ID:", import.meta.env.VITE_EMAILJS_SERVICE_ID ? "✓ Defined" : "✗ Undefined");
console.log("[EmailJS Config Debug] Public Key:", import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? "✓ Defined" : "✗ Undefined");
console.log("[EmailJS Config Debug] General Template ID:", import.meta.env.VITE_EMAILJS_GENERAL_TEMPLATE ? "✓ Defined" : "✗ Undefined");
console.log("[EmailJS Config Debug] Interview Template ID:", import.meta.env.VITE_EMAILJS_INTERVIEW_TEMPLATE ? "✓ Defined" : "✗ Undefined");

// Helper to check configuration
const getEmailJSConfig = () => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
  
  return { serviceId, publicKey };
};

/**
 * Sends a general recruitment email (Offer, Rejection, AI Feedback, Recruiter message, welcome, etc.)
 * Uses EMAIL_TEMPLATES.GENERAL
 *
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.subject
 * @param {string} params.message
 * @param {string} [params.companyName]
 * @param {string} [params.senderName]
 * @returns {Promise<{success: boolean, message?: string, error?: string, response?: any}>}
 */
export const sendGeneralEmail = async ({
  toEmail,
  toName,
  subject,
  message,
  companyName,
  senderName
}) => {
  try {
    if (!toEmail) {
      return { success: false, error: 'Missing required field: toEmail' };
    }
    if (!subject) {
      return { success: false, error: 'Missing required field: subject' };
    }
    if (!message) {
      return { success: false, error: 'Missing required field: message' };
    }

    const { serviceId, publicKey } = getEmailJSConfig();
    const templateId = EMAIL_TEMPLATES.GENERAL;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('[emailService] EmailJS is unconfigured. Simulating general email log.', { toEmail, toName, subject, message });
      return { success: true, message: 'Email logged successfully (Simulation)' };
    }

    const templateParams = {
      to_email: toEmail,
      email: toEmail,
      recipient_email: toEmail,
      to_name: toName || 'Candidate',
      subject: subject,
      message: message,
      body: message,
      sender_name: senderName || 'HireMate Team',
      company_name: companyName || 'HireMate AI'
    };

    console.log(`[emailService] Directing general template payload to ${toEmail}:`, templateParams);
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return { success: true, message: 'Email sent successfully via EmailJS', response };
  } catch (err) {
    console.error('[emailService] Exception encountered in sendGeneralEmail:', err);
    return { success: false, error: err.message || err.text || String(err) };
  }
};

/**
 * Sends an interview invitation or reminder email
 * Uses EMAIL_TEMPLATES.INTERVIEW
 *
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.companyName
 * @param {string} params.jobRole
 * @param {string} params.interviewDate
 * @param {string} params.interviewTime
 * @param {string} params.interviewMode
 * @param {string} [params.meetingLink]
 * @param {string} [params.message]
 * @returns {Promise<{success: boolean, message?: string, error?: string, response?: any}>}
 */
export const sendInterviewEmail = async ({
  toEmail,
  toName,
  companyName,
  jobRole,
  interviewDate,
  interviewTime,
  interviewMode,
  meetingLink,
  message
}) => {
  try {
    if (!toEmail) {
      return { success: false, error: 'Missing required field: toEmail' };
    }
    if (!jobRole) {
      return { success: false, error: 'Missing required field: jobRole' };
    }
    if (!interviewDate) {
      return { success: false, error: 'Missing required field: interviewDate' };
    }
    if (!interviewTime) {
      return { success: false, error: 'Missing required field: interviewTime' };
    }
    if (!interviewMode) {
      return { success: false, error: 'Missing required field: interviewMode' };
    }

    const { serviceId, publicKey } = getEmailJSConfig();
    const templateId = EMAIL_TEMPLATES.INTERVIEW;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('[emailService] EmailJS is unconfigured. Simulating interview invitation log.', { toEmail, toName, jobRole, interviewDate, interviewTime });
      return { success: true, message: 'Interview invitation logged successfully (Simulation)' };
    }

    const templateParams = {
      to_email: toEmail,
      email: toEmail,
      recipient_email: toEmail,
      to_name: toName || 'Candidate',
      company_name: companyName || 'HireMate AI',
      job_role: jobRole,
      interview_date: interviewDate,
      interview_time: interviewTime,
      interview_mode: interviewMode,
      meeting_link: meetingLink || '',
      message: message || `You have been scheduled for an interview for the ${jobRole} role.`
    };

    console.log(`[emailService] Directing interview template payload to ${toEmail}:`, templateParams);
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return { success: true, message: 'Interview scheduled successfully via EmailJS', response };
  } catch (err) {
    console.error('[emailService] Exception encountered in sendInterviewEmail:', err);
    return { success: false, error: err.message || err.text || String(err) };
  }
};
