import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { examApi } from '../services/examApi';
import { adminExamApi } from '../services/adminExamApi';
import { adminResultApi } from '../services/adminResultApi';
import { adminLinks, studentLinks } from '../components/navigation';
import { EmptyState, Icon, Notice, ScoreChart, Skeleton, StatCard } from '../components/UI';
export default function HomePage() {
  const {user}=useAuth();
  const admin=user.role==='ADMIN';
  const [today] = useState(() => new Date().toLocaleDateString("vi-VN", {day:"numeric",month:"long",year:"numeric"}));
  const [data,setData]=useState({});
  const [loading,setLoading]=useState(true);
  const [errors,setErrors]=useState([]);
  useEffect(()=>{
    let active=true;
    const requests=admin ? [['subjects',()=>api.get('/subjects').then(r=>r.data.data)],['questions',()=>api.get('/questions').then(r=>r.data.data)],['exams',adminExamApi.getExams],['results',adminResultApi.getAll]] : [['exams',examApi.getPublished],['results',examApi.getMyResults]];
    Promise.allSettled(requests.map(([,fetch])=>fetch())).then(values=>{
      if(!active)return;
      const next={},failed=[];
      values.forEach((item,i)=>{if(item.status==='fulfilled' && Array.isArray(item.value))next[requests[i][0]]=item.value;else failed.push(({subjects:'môn học',questions:'câu hỏi',exams:'đề thi',results:'kết quả'})[requests[i][0]]);});
      setData(next);setErrors(failed);setLoading(false);
    });
    return ()=>{active=false;};
  },[admin]);
  const {subjects,questions,exams,results}=data;
  const mean=results?.length ? (results.reduce((s,r)=>s+Number(r.score),0)/results.length).toFixed(1):null;
  const highest=results?.length ? Math.max(...results.map(r=>Number(r.score))).toFixed(1):null;
  const recent=[...(results||[])].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)).slice(0,5);
  const links=admin?adminLinks:studentLinks;
  const states=[['DRAFT','Bản nháp','draft'],['PUBLISHED','Đã xuất bản','published'],['CLOSED','Đã đóng','closed']].map(([status,label,color])=>({label,color,count:exams?.filter(e=>e.status===status).length||0}));
  let angle=0;
  const gradient=states.map(s=>{const start=angle;angle+=exams?.length?s.count/exams.length*360:0;return `var(--${s.color}) ${start}deg ${angle}deg`;}).join(',');
  return <main className="dashboard-page"><div className="page-heading"><div><span className="eyebrow">{admin?'WORKSPACE OVERVIEW':'YOUR LEARNING JOURNEY'}</span><h1>Tổng quan {admin?'quản trị':'học tập'}</h1><p>{admin?'Một góc nhìn toàn diện cho mọi hoạt động thi.':'Theo dõi kết quả và sẵn sàng cho thử thách tiếp theo.'}</p></div><span className="date-label">{today}</span></div>
  <section className="welcome-banner"><div><span className="banner-label">{admin?'QUẢN LÝ HIỆU QUẢ · DẠY HỌC CHỦ ĐỘNG':'HỌC HÔM NAY · VỮNG VÀNG NGÀY MAI'}</span><h2>Xin chào, {user.fullName} <span className="wave">✧</span></h2><p>{admin?'Tổ chức môn học, xây dựng đề thi và theo dõi từng kết quả.':'Mỗi lần luyện tập là một cơ hội để tiến xa hơn. Bắt đầu thôi!'}</p><Link className="banner-button" to={admin?'/admin/exams':'/student/exams'}>{admin?'Quản lý đề thi':'Khám phá đề thi'}<Icon name="arrow" size={18}/></Link></div><div className="banner-art" aria-hidden="true"><div className="art-orbit"/><div className="art-paper"><Icon name="book" size={45}/><i/><i/><i/></div><span className="art-check"><Icon name="check" size={28}/></span><span className="art-spark">✦</span></div></section>
  {errors.length>0 && <Notice>Không tải được dữ liệu {errors.join(', ')}. Các chỉ số tương ứng chưa có dữ liệu; hãy tải lại trang để thử lại.</Notice>}
  {loading ? <Skeleton count={4}/> : <div className="stats-grid">{admin?<><StatCard label="Tổng số môn học" value={subjects?.length} icon="book"/><StatCard label="Ngân hàng câu hỏi" value={questions?.length} icon="file"/><StatCard label="Tổng số đề thi" value={exams?.length} icon="file"/><StatCard label="Đề đã xuất bản" value={exams?.filter(e=>e.status==='PUBLISHED').length} icon="check"/></>:<><StatCard label="Bài thi đã hoàn thành" value={results?.length} icon="check"/><StatCard label="Điểm trung bình" value={mean ? `${mean}/10` : '—'} hint={mean?'Trên các bài đã hoàn thành':'Chưa có kết quả'}/><StatCard label="Điểm cao nhất" value={highest ? `${highest}/10` : '—'} hint={highest?'Kết quả cá nhân tốt nhất':'Chưa có kết quả'}/><StatCard label="Đề thi có thể làm" value={exams?.length} icon="book"/></>}</div>}
  <div className="dashboard-columns"><section className="panel"><div className="section-title"><div><h2>{admin?'Trạng thái đề thi':'Đề thi dành cho bạn'}</h2><p>{admin?'Phân bố các đề trong hệ thống':'Chọn một đề để bắt đầu luyện tập'}</p></div><Link to={admin?'/admin/exams':'/student/exams'}>Xem tất cả ↗</Link></div>{loading?<Skeleton count={1}/>:!exams?.length?<EmptyState>Chưa có đề thi</EmptyState>:admin?<div className="status-distribution"><div className="donut" role="img" aria-label={states.map(s=>`${s.label}: ${s.count}`).join(', ')} style={{background:`conic-gradient(${gradient})`}}><div><strong>{exams.length}</strong><span>Tổng đề thi</span></div></div><div className="chart-legend">{states.map(s=><div key={s.color}><i style={{background:`var(--${s.color})`}}/><span>{s.label}</span><strong>{s.count}</strong></div>)}</div></div>:<div className="dashboard-exams">{exams.slice(0,3).map(exam=><Link key={exam.id} to={`/student/exams/${exam.id}`} className="dashboard-exam"><span className="stat-icon"><Icon name="book"/></span><div><span className="text-muted">{exam.subject?.name}</span><h3>{exam.title}</h3><small>{exam.durationMinutes} phút · {exam._count?.examQuestions??0} câu hỏi</small></div><Icon name="arrow"/></Link>)}</div>}</section><section className="panel quick-panel"><div className="section-title"><div><h2>Truy cập nhanh</h2><p>Mọi công cụ, ngay trong tầm tay</p></div></div><div className="quick-actions">{links.map(([path,label,icon])=><Link to={path} key={path}><span className="stat-icon"><Icon name={icon}/></span><strong>{label}</strong><Icon name="arrow" size={17}/></Link>)}</div><div className="quick-note"><Icon name="check"/><span>{admin?'Sẵn sàng cho một buổi thi được tổ chức tốt.':'Tập trung vào tiến bộ, từng câu hỏi một.'}</span></div></section></div>
  {admin && !loading && <div className="stats-grid compact-stats"><StatCard label="Tổng lượt thi" value={results?.length}/><StatCard label="Điểm trung bình" value={mean?`${mean}/10`:'—'} hint={mean?'Tất cả kết quả đã chấm':'Chưa có kết quả'}/><StatCard label="Điểm cao nhất" value={highest?`${highest}/10`:'—'} hint={highest?'Từ các bài đã nộp':'Chưa có kết quả'}/></div>}
  <section className="panel"><div className="section-title"><div><h2>Kết quả gần đây</h2><p>{admin?'Các lượt nộp bài mới nhất':'Nhìn lại những bài thi bạn đã hoàn thành'}</p></div><Link to={admin?'/admin/results':'/student/results'}>Xem lịch sử ↗</Link></div>{loading?<Skeleton count={1}/>:!recent.length?<EmptyState>Chưa có kết quả thi</EmptyState>:<div className="table-scroll"><table><thead><tr>{admin&&<th>Sinh viên</th>}<th>Đề thi</th><th>Môn học</th><th>Thời gian nộp</th><th>Điểm số</th>{!admin&&<th>Chi tiết</th>}</tr></thead><tbody>{recent.map(r=><tr key={r.id}>{admin&&<td><strong>{r.user?.fullName}</strong><small>{r.user?.email}</small></td>}<td>{r.exam?.title}</td><td>{r.exam?.subject?.name}</td><td>{new Date(r.submittedAt).toLocaleString('vi-VN')}</td><td><span className="score-badge">{Number(r.score).toFixed(1)}/10</span></td>{!admin&&<td><Link to={`/student/results/${r.id}`}>Xem bài ↗</Link></td>}</tr>)}</tbody></table></div>}</section>{!loading&&results && <ScoreChart results={results}/>}
  </main>;
}
