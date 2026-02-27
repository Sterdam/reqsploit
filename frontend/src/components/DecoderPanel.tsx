import { useState } from 'react';
import { useDecoderStore, type EncodingType, type HashType } from '../stores/decoderStore';
import { ArrowDown, ArrowUp, Copy, RotateCw, Sparkles } from 'lucide-react';

export function DecoderPanel() {
  const {
    input,
    output,
    selectedEncoding,
    selectedHash,
    detectedEncoding,
    history,
    isLoading,
    error,
    setInput,
    clearInput,
    clearOutput,
    swapInputOutput,
    setSelectedEncoding,
    encode,
    decode,
    autoDetect,
    setSelectedHash,
    hash,
    loadFromHistory,
    clearHistory,
  } = useDecoderStore();

  const [activeOperation, setActiveOperation] = useState<'encode' | 'decode' | 'hash'>('encode');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleQuickAction = async (type: 'encode' | 'decode', encoding: EncodingType) => {
    setSelectedEncoding(encoding);
    if (type === 'encode') {
      await encode(encoding);
    } else {
      await decode(encoding);
    }
  };

  const handleQuickHash = async (algorithm: HashType) => {
    setSelectedHash(algorithm);
    await hash(algorithm);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D]">
        <h2 className="text-lg font-semibold text-white">Decoder / Encoder / Hasher</h2>
        <p className="text-sm text-white/60 mt-1">
          Encode, decode, and hash data with automatic detection
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-auto">
          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Input</label>
              <button
                onClick={clearInput}
                className="text-xs text-white/60 hover:text-white"
              >
                Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to encode, decode, or hash..."
              className="w-full h-32 px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Operations Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            <button
              onClick={() => setActiveOperation('encode')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeOperation === 'encode'
                  ? 'text-blue-400 border-b-2 border-blue-600'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setActiveOperation('decode')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeOperation === 'decode'
                  ? 'text-blue-400 border-b-2 border-blue-600'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Decode
            </button>
            <button
              onClick={() => setActiveOperation('hash')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeOperation === 'hash'
                  ? 'text-blue-400 border-b-2 border-blue-600'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Hash
            </button>
          </div>

          {/* Operation Controls */}
          <div className="flex items-center gap-3">
            {(activeOperation === 'encode' || activeOperation === 'decode') && (
              <>
                <select
                  value={selectedEncoding}
                  onChange={(e) => setSelectedEncoding(e.target.value as EncodingType)}
                  className="px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
                >
                  <optgroup label="Common">
                    <option value="url">URL Encoding</option>
                    <option value="base64">Base64</option>
                    <option value="base32">Base32</option>
                    <option value="html">HTML Entities</option>
                    <option value="hex">Hexadecimal</option>
                    <option value="unicode">Unicode Escape</option>
                  </optgroup>
                  <optgroup label="Binary & Numbers">
                    <option value="binary">Binary</option>
                    <option value="octal">Octal</option>
                    <option value="decimal">Decimal (ASCII)</option>
                  </optgroup>
                  <optgroup label="Ciphers & Codes">
                    <option value="rot13">ROT13</option>
                    <option value="morse">Morse Code</option>
                    <option value="reverse">Reverse String</option>
                  </optgroup>
                  <optgroup label="Compression & Formatting">
                    <option value="gzip">Gzip</option>
                    <option value="json">JSON Prettify</option>
                    <option value="jwt">JWT Decode</option>
                  </optgroup>
                </select>

                {activeOperation === 'encode' ? (
                  <button
                    onClick={() => encode()}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Encode
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => decode()}
                      disabled={isLoading || !input.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <ArrowUp className="w-4 h-4" />
                      Decode
                    </button>
                    <button
                      onClick={autoDetect}
                      disabled={isLoading || !input.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Auto-Detect
                    </button>
                  </>
                )}
              </>
            )}

            {activeOperation === 'hash' && (
              <>
                <select
                  value={selectedHash}
                  onChange={(e) => setSelectedHash(e.target.value as HashType)}
                  className="px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
                >
                  <optgroup label="Legacy">
                    <option value="md5">MD5</option>
                    <option value="sha1">SHA-1</option>
                  </optgroup>
                  <optgroup label="SHA-2">
                    <option value="sha256">SHA-256</option>
                    <option value="sha512">SHA-512</option>
                  </optgroup>
                  <optgroup label="SHA-3">
                    <option value="sha3-256">SHA3-256</option>
                    <option value="sha3-512">SHA3-512</option>
                  </optgroup>
                  <optgroup label="Modern">
                    <option value="blake2b512">BLAKE2b-512</option>
                  </optgroup>
                </select>

                <button
                  onClick={() => hash()}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium disabled:opacity-50"
                >
                  Hash
                </button>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Quick Actions</label>
            <div className="flex flex-wrap gap-2">
              {/* Common Encodings */}
              <button
                onClick={() => handleQuickAction('encode', 'url')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                URL Encode
              </button>
              <button
                onClick={() => handleQuickAction('decode', 'url')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                URL Decode
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'base64')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Base64 Encode
              </button>
              <button
                onClick={() => handleQuickAction('decode', 'base64')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Base64 Decode
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'hex')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Hex Encode
              </button>
              <button
                onClick={() => handleQuickAction('decode', 'hex')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Hex Decode
              </button>

              {/* Binary & Numbers */}
              <button
                onClick={() => handleQuickAction('encode', 'binary')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Binary
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'decimal')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                ASCII Decimal
              </button>

              {/* Ciphers */}
              <button
                onClick={() => handleQuickAction('encode', 'rot13')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                ROT13
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'morse')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Morse
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'reverse')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                Reverse
              </button>

              {/* Formatting */}
              <button
                onClick={() => handleQuickAction('decode', 'jwt')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                JWT Decode
              </button>
              <button
                onClick={() => handleQuickAction('encode', 'json')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                JSON Prettify
              </button>

              {/* Hashing */}
              <button
                onClick={() => handleQuickHash('md5')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                MD5
              </button>
              <button
                onClick={() => handleQuickHash('sha256')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                SHA-256
              </button>
              <button
                onClick={() => handleQuickHash('sha512')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10"
              >
                SHA-512
              </button>

              {/* Utilities */}
              <button
                onClick={swapInputOutput}
                disabled={!output}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded border border-white/10 disabled:opacity-50"
              >
                <RotateCw className="w-3 h-3 inline mr-1" />
                Swap
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">
                Output
                {detectedEncoding && (
                  <span className="ml-2 text-xs text-green-400">
                    (Detected: {detectedEncoding})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                {output && (
                  <button
                    onClick={() => copyToClipboard(output)}
                    className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                )}
                <button
                  onClick={clearOutput}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="w-full h-32 px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm font-mono resize-none"
            />
            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        {history.length > 0 && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-[#0D1F2D]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">History ({history.length})</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-white/60 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry.id)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-400">
                      {entry.operation === 'hash'
                        ? entry.hash?.toUpperCase()
                        : `${entry.operation} ${entry.encoding}`}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {entry.input.substring(0, 50)}
                    {entry.input.length > 50 && '...'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
