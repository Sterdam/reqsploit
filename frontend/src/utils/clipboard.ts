import { toast } from '../stores/toastStore';

export async function copyToClipboard(text: string, label = 'Text') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied!', `${label} copied to clipboard`);
  } catch {
    toast.error('Copy Failed', 'Could not copy to clipboard');
  }
}
