import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase-client';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
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
            {isSignUp 
              ? '계정을 생성하고 모든 기기에서 일정을 실시간으로 연동하세요' 
              : '로그인하여 클라우드에 일정을 안전하게 동기화하세요'}
          </p>
        </div>

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
      </div>
    </div>
  );
}
