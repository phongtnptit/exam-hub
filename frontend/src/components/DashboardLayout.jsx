import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './UI';
import { adminLinks, studentLinks } from "./navigation";
export default function DashboardLayout() {
  const {user,logout}=useAuth();
  const {pathname}=useLocation();
  const [open,setOpen]=useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const taking=pathname.startsWith('/student/attempts/');
  const links=user.role==='ADMIN'?adminLinks:studentLinks;
  const title=pathname==='/'?'Tổng quan':taking?'Không gian làm bài':links.find(([path])=>pathname.startsWith(path))?.[1] || 'ExamHub Mini';
  const parent = links.find(([path]) => pathname.startsWith(path + '/'));
  const detailLabel = pathname.startsWith('/student/results/') ? 'Chi ti?t k?t qu?' : 'Th?ng tin ?? thi';
  const breadcrumbs = pathname === '/' ? [{ label: 'T?ng quan' }] : taking
    ? [{ label: 'Kh?ng gian l?m b?i' }]
    : [{ label: 'T?ng quan', to: '/' }, ...(parent ? [{ label: parent[1], to: parent[0] }, { label: detailLabel }] : [{ label: title }])];
  return <div className={`app-shell ${taking?'exam-mode':''}`}><a className="skip-link" href="#page-content">Đến nội dung</a>{!taking && <>
    {open && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={()=>setOpen(false)}/>}
    <aside className={`app-sidebar ${open?'is-open':''}`}><NavLink className="brand" to="/" onClick={()=>setOpen(false)}><span className="brand-mark"><Icon size={25}/></span><span>ExamHub<span className="brand-mini">MINI · LEARNING SPACE</span></span></NavLink><button className="sidebar-close secondary" aria-label="Đóng menu" onClick={()=>setOpen(false)}><Icon name="close"/></button><span className="nav-label">KHÔNG GIAN {user.role==='ADMIN'?'QUẢN TRỊ':'HỌC TẬP'}</span><nav aria-label="Điều hướng chính"><NavLink to="/" end onClick={()=>setOpen(false)}><Icon name="grid"/>Tổng quan</NavLink>{links.map(([path,label,icon])=><NavLink key={path} to={path} onClick={()=>setOpen(false)}><Icon name={icon}/>{label}</NavLink>)}</nav><div className="sidebar-note"><span className="note-orbit">✧</span><strong>Mỗi bài thi, một bước tiến.</strong><p>Học chủ động. Thi tự tin.</p></div><section className="sidebar-profile" aria-label="Th?ng tin t?i kho?n"><span className="avatar" aria-hidden="true">{user.fullName?.slice(0,1)}</span><div><strong>{user.fullName}</strong><small>{user.role==='ADMIN'?'Quản trị viên':'Sinh viên'}</small></div><button className="icon-button" title="Đăng xuất" aria-label="Đăng xuất" onClick={logout}><Icon name="logout"/></button></section></aside></>}
    <div className="app-workspace"><header className="app-header"><div className="header-left">{!taking && <button className="menu-button secondary" aria-label="Mở menu" aria-expanded={open} onClick={()=>setOpen(!open)}><Icon name="menu"/></button>}<nav className="breadcrumb" aria-label="???ng d?n trang"><ol>{breadcrumbs.map((item, index) => <li key={item.label}>{index > 0 && <span className="breadcrumb-separator" aria-hidden="true">/</span>}{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav></div><div className="header-right"><span className="workspace-badge"><span/>{taking?'Phiên làm bài':user.role==='ADMIN'?'Quản trị viên':'Sinh viên'}</span><span className="avatar">{user.fullName?.slice(0,1)}</span></div></header><div id="page-content" className="page-content" tabIndex={-1}><Outlet/></div><footer className="app-footer"><span>ExamHub Mini</span><span>Không gian thi trực tuyến của bạn</span></footer></div></div>;
}
