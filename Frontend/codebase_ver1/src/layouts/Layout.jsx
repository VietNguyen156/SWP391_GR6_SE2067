import {Outlet,useLocation,useNavigate} from 'react-router-dom';
import React from "react";
import {BookOpen,LogOut} from 'lucide-react';
import {nav} from '../data/navigation';
export default function Layout(){const loc=useLocation(),go=useNavigate();const role=loc.pathname.split('/')[1]||'user';const items=nav[role]||nav.user;return <div className="shell"><aside><div className="brand"><BookOpen/> Learning</div><div className="role">{role.toUpperCase()} PORTAL</div><nav>{items.map(([p,n])=><button className={loc.pathname===`/${role}/${p}`?'active':''} onClick={()=>go(`/${role}/${p}`)} key={p}>{n}</button>)}</nav><div className="switch"><small>DEMO ROLE</small>{['user','manager','admin'].map(r=><button key={r} onClick={()=>go(`/${r}/dashboard`)}>{r}</button>)}</div></aside><main><header><div><b>English Learning</b></div><button className="logout" onClick={()=>go('/login')}><LogOut size={17}/> Logout</button></header><section className="content"><Outlet/></section></main></div>}
