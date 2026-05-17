import React, { useState } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  isSupabaseDynamic, 
  saveRuntimeSupabaseConfig, 
  clearRuntimeSupabaseConfig 
} from '../lib/supabase-client';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic configuration states
  const [showConfig, setShowConfig] = useState(!isSupabaseConfigured);
  const [dynUrl, setDynUrl] = useState(localStorage.getItem('dohun_supabase_url') || '');
  const [dynKey, setDynKey] = useState(localStorage.getItem('dohun_supabase_anon_key') || '');

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dynUrl || !dynKey) {
      setErrorMsg('Supabase URL과 Anon Key를 모두 입력해 주세요.');
      return;
    }
    const success = saveRuntimeSupabaseConfig(dynUrl, dynKey);
    if (success) {
      alert('Supabase 연동 설정이 저장되었습니다! 일정을 동기화하기 위해 앱을 재시작합니다.');
      window.location.reload();
    } else {
      setErrorMsg('올바르지 않은 값입니다.');
    }
  };

  const handleClearConfig = () => {
    if (window.confirm('저장된 Supabase 설정을 초기화하고 기본 오프라인 모드로 돌아가시겠습니까?')) {
      clearRuntimeSupabaseConfig();
      window.location.reload();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase API 키가 설정되지 않았습니다. 설정을 확인해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        alert('회원가입이 완료되었습니다! 가입하신 이메일로 로그인해 주세요.');
        setIsSignUp(false);
      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user?.email) {
          onSuccess(data.user.email);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || '인증 과정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
          <h2>Dohun<span>Calender</span> Cloud</h2>
          <p className="auth-subtitle">
            {showConfig
              ? '데스크톱 앱 클라우드 연동 설정을 구성합니다'
              : isSignUp 
                ? '계정을 생성하고 모든 기기에서 일정을 실시간으로 연동하세요' 
                : '로그인하여 클라우드에 일정을 안전하게 동기화하세요'}
          </p>
        </div>

        {showConfig ? (
          <div className="auth-config-section">
            <div className="auth-warning-banner" style={{ background: 'rgba(204, 120, 92, 0.08)', borderColor: 'rgba(204, 120, 92, 0.2)', color: 'var(--color-primary)' }}>
              ⚙️ <strong>클라우드 연동 설정:</strong> 데스크톱 앱(Electron)에서 일정 동기화를 사용하려면 Supabase 프로젝트의 API 키를 입력해 주세요. 웹 브라우저의 키와 동일하게 설정하면 실시간으로 일정이 연동됩니다.
            </div>
            
            <form onSubmit={handleSaveConfig} className="auth-form">
              <div className="form-group">
                <label htmlFor="dynUrl">Supabase Project URL</label>
                <input
                  type="url"
                  id="dynUrl"
                  placeholder="https://xxxxxx.supabase.co"
                  value={dynUrl}
                  onChange={e => setDynUrl(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dynKey">Supabase Anon Key</label>
                <input
                  type="password"
                  id="dynKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dynKey}
                  onChange={e => setDynKey(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {errorMsg && <div className="auth-error-message">{errorMsg}</div>}

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                설정 저장 및 연결
              </button>

              {isSupabaseConfigured && (
                <button 
                  type="button" 
                  className="auth-back-btn"
                  onClick={() => { setShowConfig(false); setErrorMsg(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    textAlign: 'center',
                    textDecoration: 'underline'
                  }}
                >
                  로그인 화면으로 돌아가기
                </button>
              )}
            </form>
          </div>
        ) : (
          <>
            {!isSupabaseConfigured && (
              <div className="auth-warning-banner">
                ⚠️ <strong>개발자 경고:</strong> Supabase API 키가 환경 변수(.env)에 설정되어 있지 않아 실제 로그인이 차단된 모드입니다.
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">이메일 주소</label>
                <input
                  type="email"
                  id="email"
                  placeholder="example@dohun.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {errorMsg && <div className="auth-error-message">{errorMsg}</div>}

              <button 
                type="submit" 
                className="btn-primary auth-submit-btn" 
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner"></span>
                ) : isSignUp ? (
                  '계정 만들기'
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            <div className="auth-footer">
              {isSignUp ? (
                <p>
                  이미 계정이 있으신가요?{' '}
                  <button type="button" onClick={() => { setIsSignUp(false); setErrorMsg(''); }} disabled={loading}>
                    로그인하기
                  </button>
                </p>
              ) : (
                <p>
                  아직 계정이 없으신가요?{' '}
                  <button type="button" onClick={() => { setIsSignUp(true); setErrorMsg(''); }} disabled={loading}>
                    무료 회원가입
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        <div className="auth-settings-footer-row" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          {isSupabaseDynamic ? (
            <button 
              type="button" 
              className="auth-link-btn"
              onClick={handleClearConfig}
              style={{ fontSize: '11px', color: 'var(--color-holiday)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              🗑️ 사용자 지정 API 키 연결 초기화 (Reset Settings)
            </button>
          ) : (
            <button 
              type="button" 
              className="auth-link-btn"
              onClick={() => { setShowConfig(true); setErrorMsg(''); }}
              style={{ fontSize: '11px', color: 'var(--color-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              ⚙️ Supabase API 키 수동 설정 (Configure Keys)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

