'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PointItem = {
  device_id: string;
  player_name: string;
  points: number;
  checkin_streak: number;
  total_checkins: number;
  total_spins: number;
};

type Loan = {
  id: string;
  principal: number;
  repaid: number;
  interest_rate: number;
  borrowed_at: string;
  days: number;
  interest: number;
  total: number;
  remaining: number;
};

type LoanSummary = {
  count: number;
  total_debt: number;
  total_principal: number;
  total_interest: number;
  total_repaid: number;
  max_loan: number;
};

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('device_id', id);
  }
  return id;
}

function getRate(amount: number): number {
  if (amount >= 5000) return 0.03;
  if (amount >= 1000) return 0.02;
  return 0.01;
}

export default function PointsPage() {
  const [items, setItems] = useState<PointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDeviceId, setMyDeviceId] = useState('');
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number | null>(null);

  // 借款相关
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loanModal, setLoanModal] = useState<'borrow' | 'repay' | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadRank() {
    try {
      const res = await fetch(`/api/points/rank?limit=100&t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      const list: PointItem[] = d.data || [];
      setItems(list);
      const idx = list.findIndex((it) => it.device_id === myDeviceId);
      if (idx >= 0) {
        setMyRank(idx + 1);
        setMyPoints(list[idx].points);
      } else {
        setMyRank(null);
      }
    } catch {}
  }

  async function loadLoans() {
    if (!myDeviceId) return;
    try {
      const res = await fetch(`/api/loans?device_id=${myDeviceId}&t=${Date.now()}`, { cache: 'no-store' });
      const d = await res.json();
      if (d.data) {
        setLoans(d.data.loans || []);
        setSummary(d.data.summary);
      }
    } catch {}
  }

  async function loadMyPoints() {
    if (!myDeviceId) return;
    try {
      const name = localStorage.getItem('player_name') || '匿名玩家';
      const res = await fetch(
        `/api/points?device_id=${myDeviceId}&player_name=${encodeURIComponent(name)}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const d = await res.json();
      if (d.data) setMyPoints(d.data.points);
    } catch {}
  }

  useEffect(() => {
    const id = getDeviceId();
    setMyDeviceId(id);
  }, []);

  useEffect(() => {
    if (!myDeviceId) return;
    Promise.all([loadRank(), loadLoans(), loadMyPoints()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myDeviceId]);

  // 借款
  async function handleBorrow() {
    const amt = Number(loanAmount);
    if (!Number.isFinite(amt) || amt < 1 || Math.floor(amt) !== amt) {
      alert('借款金额必须是 ≥ 1 的整数');
      return;
    }
    if (amt > 10000) { alert('单笔借款上限 10000'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: myDeviceId, amount: amt }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '借款失败');
      const rate = (d.data.rate * 100).toFixed(1);
      alert(`借款成功！\n到账 ${d.data.amount} 积分\n日息 ${rate}%`);
      setLoanModal(null);
      setLoanAmount('');
      await Promise.all([loadRank(), loadLoans(), loadMyPoints()]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 还款
  async function handleRepay() {
    const amt = Number(loanAmount);
    if (!Number.isFinite(amt) || amt < 1 || Math.floor(amt) !== amt) {
      alert('还款金额必须是 ≥ 1 的整数');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: myDeviceId, amount: amt }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '还款失败');
      alert(`还款成功！\n已还 ${d.data.paid} 积分\n剩余积分 ${d.data.points}`);
      setLoanModal(null);
      setLoanAmount('');
      await Promise.all([loadRank(), loadLoans(), loadMyPoints()]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 阶梯利率预览
  const previewRate = loanAmount ? getRate(Number(loanAmount)) : 0;
  const previewAmount = Number(loanAmount) || 0;

  return (
    <div className="fade-up max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            🪙 积分排行榜
          </h1>
          <p className="text-sm text-gray-500 mt-1">前 100 名</p>
        </div>
        <Link href="/spin" className="btn-gradient text-sm px-4 py-2">
          🎰 转盘抽奖
        </Link>
      </div>

      {/* 我的排名 + 借款卡片 */}
      {myDeviceId && (
        <div className="glass-card p-5 sm:p-6 mb-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3 bg-white/50 dark:bg-white/5 text-center">
              <div className="text-2xl font-bold text-indigo-500 tabular-nums">
                {myRank === null ? '—' : `#${myRank}`}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">我的排名</div>
            </div>
            <div className="rounded-xl p-3 bg-white/50 dark:bg-white/5 text-center">
              <div className="text-2xl font-bold text-yellow-500 tabular-nums">
                {myPoints ?? '—'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">我的积分</div>
            </div>
            <Link
              href="/user"
              className="rounded-xl p-3 bg-gradient-to-br from-indigo-500/15 to-pink-500/15 border border-indigo-500/20 flex items-center justify-center text-center hover:from-indigo-500/25 hover:to-pink-500/25 transition"
            >
              <div>
                <div className="text-xl">📅</div>
                <div className="text-[11px] text-indigo-500 font-medium mt-1">去签到</div>
              </div>
            </Link>
          </div>

          {/* 欠款信息 */}
          {summary && summary.total_debt > 0 && (
            <div className="mb-4 p-4 rounded-xl border-l-4 border-red-500 bg-red-500/5">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-sm font-bold text-red-500">
                  ⚠️ 欠款中
                </span>
                <span className="text-xs text-gray-500">
                  {summary.count} 笔 · 签到/转盘收益自动抵扣
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">待还总额</div>
                  <div className="text-base font-bold text-red-500 tabular-nums">
                    {summary.total_debt}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">本金</div>
                  <div className="text-base font-bold tabular-nums">
                    {summary.total_principal}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">累计利息</div>
                  <div className="text-base font-bold text-orange-500 tabular-nums">
                    +{summary.total_interest}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">已还</div>
                  <div className="text-base font-bold text-green-500 tabular-nums">
                    {summary.total_repaid}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 借款按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => { setLoanModal('borrow'); setLoanAmount(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:brightness-110 transition"
            >
              💰 借款
            </button>
            {summary && summary.total_debt > 0 && (
              <button
                onClick={() => { setLoanModal('repay'); setLoanAmount(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:brightness-110 transition"
              >
                💵 还款（{summary.total_debt}）
              </button>
            )}
          </div>

          {/* 借款明细 */}
          {loans.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-xs text-gray-500 mb-2">借款明细</div>
              <div className="space-y-1.5">
                {loans.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5">
                    <span className="text-gray-500 shrink-0">
                      借 {l.principal}，{(l.interest_rate * 100).toFixed(1)}%/天
                    </span>
                    <span className="text-gray-400 shrink-0">{l.days} 天</span>
                    <span className="ml-auto text-red-500 font-bold tabular-nums shrink-0">
                      欠 {l.remaining}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 排行榜 */}
      <div className="glass-card p-4 sm:p-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse bg-white/40 dark:bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-5xl mb-3">🪙</div>
            <p>还没有积分记录</p>
            <Link href="/user" className="btn-gradient inline-block mt-6 px-6 py-2.5 text-sm">
              去签到赚积分
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((p, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              const isMe = p.device_id === myDeviceId;
              const isTop3 = i < 3;
              return (
                <div
                  key={p.device_id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-500/30'
                      : isTop3
                      ? 'bg-gradient-to-r from-amber-500/5 to-transparent hover:bg-white/40 dark:hover:bg-white/5'
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 text-center font-bold shrink-0 ${
                    i === 0 ? 'text-2xl' : i === 1 ? 'text-xl' : i === 2 ? 'text-lg' : 'text-sm text-gray-400'
                  }`}>
                    {medal}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/u/${p.device_id}`} className="font-semibold text-sm truncate hover:text-indigo-500 transition">
                        {p.player_name || '匿名玩家'}
                      </Link>
                      {isMe && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-medium shrink-0">
                          我
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-3">
                      <span>🔥 连续 {p.checkin_streak} 天</span>
                      <span>📅 累计 {p.total_checkins} 次</span>
                      <span>🎰 抽奖 {p.total_spins} 次</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-yellow-500 tabular-nums">
                      {p.points.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 -mt-0.5">积分</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 借款/还款弹窗 */}
      {loanModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLoanModal(null)}
        >
          <div
            className="glass-card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {loanModal === 'borrow' ? '💰 借款' : '💵 还款'}
            </h2>

            {loanModal === 'borrow' ? (
              <>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  借款立即到账，按天计息。<br />
                  借得越多，日息越高：<br />
                  • 1-999：<b>1%</b>/天<br />
                  • 1000-4999：<b>2%</b>/天<br />
                  • 5000-10000：<b>3%</b>/天
                </p>
                <div className="text-xs text-gray-500 mb-2">借款金额（1-10000）</div>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="输入金额"
                  min={1}
                  max={10000}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-orange-400 transition mb-3"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  {[100, 500, 1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLoanAmount(String(v))}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 transition"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {previewAmount > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">到账</span>
                      <span className="font-bold">{previewAmount}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">日息</span>
                      <span className="font-bold text-orange-500">{(previewRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">立刻还需还</span>
                      <span className="font-bold text-red-500">
                        {previewAmount + Math.floor(previewAmount * previewRate * 1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">借 7 天需还</span>
                      <span className="font-bold text-red-500">
                        {previewAmount + Math.floor(previewAmount * previewRate * 7)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBorrow}
                  disabled={submitting || !loanAmount}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:brightness-110 transition disabled:opacity-50 mb-2"
                >
                  {submitting ? '处理中…' : '确认借款'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  当前欠款 <b className="text-red-500">{summary?.total_debt || 0}</b> 积分<br />
                  可部分还款，按借款时间从早到晚依次抵扣。
                </p>
                <div className="text-xs text-gray-500 mb-2">还款金额</div>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="输入金额"
                  min={1}
                  max={myPoints || 0}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 outline-none text-sm border border-white/40 dark:border-white/10 focus:border-green-400 transition mb-3"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setLoanAmount(String(Math.min(myPoints || 0, summary?.total_debt || 0)))}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-600 hover:bg-green-500/25 transition"
                  >
                    全部（{Math.min(myPoints || 0, summary?.total_debt || 0)}）
                  </button>
                  {[100, 500, 1000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLoanAmount(String(v))}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 transition"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  我的积分：<b className="text-yellow-500">{myPoints ?? '—'}</b>
                </div>

                <button
                  onClick={handleRepay}
                  disabled={submitting || !loanAmount}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:brightness-110 transition disabled:opacity-50 mb-2"
                >
                  {submitting ? '处理中…' : '确认还款'}
                </button>
              </>
            )}

            <button
              onClick={() => setLoanModal(null)}
              className="w-full py-2.5 rounded-xl text-sm border border-gray-300 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}