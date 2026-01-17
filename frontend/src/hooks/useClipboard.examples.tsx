/**
 * useClipboard Hook - Usage Examples
 * 
 * This hook provides secure clipboard operations with "Blind Auto-Clear".
 * Perfect for copying passwords, API keys, or sensitive data.
 * 
 * Strategy: Copy → Wait 30s → Clear (no permission popups!)
 */

import { useClipboard } from '../hooks/useClipboard';

// ============================================
// Example 1: Basic Usage with Icon Feedback
// ============================================
function PasswordCopyButton({ password }: { password: string }) {
  const { copy, isCopied } = useClipboard();

  return (
    <button 
      onClick={() => copy(password)}
      className="p-2 rounded hover:bg-gray-100"
    >
      {isCopied ? (
        <CheckIcon className="w-5 h-5 text-green-500" />
      ) : (
        <CopyIcon className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
}

// ============================================
// Example 2: Custom Timer (15 seconds)
// ============================================
function QuickClearButton({ text }: { text: string }) {
  const { copy, isCopied } = useClipboard({ 
    clearAfter: 15000 // 15 seconds
  });

  return (
    <button onClick={() => copy(text)}>
      {isCopied ? 'Copied! (clears in 15s)' : 'Copy'}
    </button>
  );
}

// ============================================
// Example 3: With Callbacks
// ============================================
function TrackedCopyButton({ apiKey }: { apiKey: string }) {
  const { copy, isCopied } = useClipboard({
    onCopy: () => {
      console.log('API key copied - logging for audit');
      // analytics.track('api_key_copied');
    },
    onClear: () => {
      console.log('Clipboard cleared');
    }
  });

  return (
    <button onClick={() => copy(apiKey)}>
      {isCopied ? '✓' : 'Copy API Key'}
    </button>
  );
}

// ============================================
// Example 4: Full Password Card Component
// ============================================
function PasswordCard({ 
  title, 
  username, 
  password 
}: { 
  title: string; 
  username: string; 
  password: string;
}) {
  const { copy: copyUsername, isCopied: usernameCopied } = useClipboard();
  const { copy: copyPassword, isCopied: passwordCopied } = useClipboard();

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-bold">{title}</h3>
      
      {/* Username Row */}
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={username} 
          readOnly 
          className="flex-1 px-3 py-2 border rounded"
        />
        <button 
          onClick={() => copyUsername(username)}
          className={`px-3 py-2 rounded ${
            usernameCopied 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {usernameCopied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Password Row */}
      <div className="flex items-center gap-2">
        <input 
          type="password" 
          value={password} 
          readOnly 
          className="flex-1 px-3 py-2 border rounded"
        />
        <button 
          onClick={() => copyPassword(password)}
          className={`px-3 py-2 rounded ${
            passwordCopied 
              ? 'bg-green-500 text-white' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {passwordCopied ? '✓ Copied' : 'Copy Password'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Example 5: Check Browser Support
// ============================================
function SmartCopyButton({ text }: { text: string }) {
  const { copy, isCopied, isSupported } = useClipboard();

  if (!isSupported) {
    return (
      <span className="text-red-500 text-sm">
        Clipboard not supported
      </span>
    );
  }

  return (
    <button onClick={() => copy(text)}>
      {isCopied ? '✓' : 'Copy'}
    </button>
  );
}

// ============================================
// Placeholder Icons (replace with your icons)
// ============================================
const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================
// Toast Setup (add to App.tsx)
// ============================================
// import toast, { Toaster } from 'react-hot-toast';
// 
// // Make toast available globally for useClipboard
// if (typeof window !== 'undefined') {
//   (window as any).toast = toast;
// }
//
// function App() {
//   return (
//     <>
//       <Toaster position="top-right" />
//       {/* Your app */}
//     </>
//   );
// }

export {
  PasswordCopyButton,
  QuickClearButton,
  TrackedCopyButton,
  PasswordCard,
  SmartCopyButton,
  CopyIcon,
  CheckIcon,
};
