import { useRef, useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { FeedbackContext } from "./useConfirm";
export function Icon({ name = 'book', size = 20, ...props }) {
  const paths = { book: 'M4 4h6a3 3 0 0 1 2 2v15a4 4 0 0 0-4-2H4V4Zm16 0h-6a3 3 0 0 0-2 2v15a4 4 0 0 1 4-2h4V4Z', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', file: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h6', chart: 'M4 3v17h17M8 15v-4M13 15V7M18 15V4', check: 'm5 12 4 4L19 6', arrow: 'M5 12h14m-5-5 5 5-5 5', logout: 'M9 4H4v16h5m5-12 4 4-4 4m-6-4h10', menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6', edit: 'm15 4 5 5M4 20l4-1L20 7l-4-4L4 15v5Z', trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7', clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.book}/></svg>;
}
export function Skeleton({ count = 3 }) { return <div className="skeleton-grid" role="status" aria-label="Đang tải dữ liệu">{Array.from({length:count},(_,i)=><div className="skeleton-card" key={i}><i/><i/><i/></div>)}</div>; }
export function EmptyState({ children = 'Chưa có dữ liệu để hiển thị.' }) { return <div className="empty-state"><span className="empty-icon"><Icon name="book" size={28}/></span><strong>{children}</strong><p>Dữ liệu sẽ xuất hiện tại đây khi có hoạt động.</p></div>; }
export function Toast({ message }) {
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setDismissed(true),6500);return ()=>clearTimeout(timer);},[]);
 return dismissed ? null : <div className="toast" role="status"><span className="toast-icon"><Icon name="check"/></span><span>{message}</span><button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setDismissed(true)}><Icon name="close" size={16}/></button></div>;
}
export function Notice({ children, type = 'error' }) { return !children ? null : type === 'success' ? <><div className="notice-message success"><Icon name="check"/><span>{children}</span></div><Toast key={children} message={children}/></> : <div className="notice-message error" role="alert"><Icon name="close"/><span>{children}</span></div>; }
export function Progress({ value, label }) { return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>; }
export function StatCard({ label, value, icon = 'chart', hint }) { return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon}/></span></div><strong>{value ?? '—'}</strong><small>{hint || 'Từ dữ liệu hiện có'}</small></article>; }
export function ScoreChart({ results }) {
  const groups = ['0 – <2','2 – <4','4 – <6','6 – <8','8 – 10'];
  const counts = groups.map((_,i)=>results.filter(r=>Number(r.score)>=i*2 && (i===4 ? Number(r.score)<=10 : Number(r.score)<(i+1)*2)).length);
  const max = Math.max(...counts,1);
  return <section className="panel"><div className="section-title"><div><h2>Phân bố điểm số</h2><p>Số lượt thi theo thang điểm 10</p></div><Icon name="chart"/></div>{results.length ? <div className="score-chart">{groups.map((label,i)=><div className="chart-column" key={label}><strong>{counts[i]}</strong><div className="bar-track"><div style={{height:`${counts[i]/max*100}%`}}/></div><span>{label}</span></div>)}</div> : <EmptyState>Chưa có kết quả thi</EmptyState>}</section>;
}
export function FeedbackProvider({ children }) {
  const { pathname } = useLocation();
  const [pending,setPending] = useState(null);
  const resolver = useRef(null);
  const dialog = useRef(null);
  const returnFocus = useRef(null);
  const confirm = (message) => new Promise(resolve => { if(resolver.current) { resolve(false); return; } returnFocus.current=document.activeElement; resolver.current=resolve; setPending({ message, pathname }); });
  const finish = (answer) => { resolver.current?.(answer); resolver.current=null; dialog.current?.close(); setPending(null); returnFocus.current?.focus(); };
  useEffect(() => () => { resolver.current?.(false); resolver.current = null; dialog.current?.close(); }, [pathname]);
  useEffect(()=>{ if(pending?.pathname === pathname) dialog.current?.showModal(); },[pending, pathname]);
  return <FeedbackContext.Provider value={confirm}>{children}{pending?.pathname === pathname && <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={e=>{e.preventDefault();finish(false);}}><span className="empty-icon"><Icon name="file" size={28}/></span><h2 id="confirm-title">Xác nhận thao tác</h2><p id="confirm-description">{pending.message}</p><div className="dialog-actions"><button className="secondary" autoFocus onClick={()=>finish(false)}>Hủy</button><button onClick={()=>finish(true)}>Xác nhận</button></div></dialog>}</FeedbackContext.Provider>;
}

