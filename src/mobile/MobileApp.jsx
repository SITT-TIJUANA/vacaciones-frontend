import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MobileDashboard from './MobileDashboard';
import MobileSolicitudes from './MobileSolicitudes';
import MobilePermisos from './MobilePermisos';
import MobileIncapacidades from './MobileIncapacidades';
import MobilePerfil from './MobilePerfil';
import MobileCalendario from './MobileCalendario';
import MobilePersonal from './MobilePersonal';

export default function MobileApp() {
  const { usuario, rolEfectivo } = useAuth();
  const [seccion, setSeccion] = useState('inicio');
  const esAdmin = ['admin','rrhh'].includes(rolEfectivo);

  const NAV = esAdmin ? [
    { id:'inicio',        icon:'🏠', label:'Inicio' },
    { id:'solicitudes',   icon:'📋', label:'Solicitudes' },
    { id:'calendario',    icon:'📅', label:'Calendario' },
    { id:'personal',      icon:'👥', label:'Personal' },
    { id:'perfil',        icon:'👤', label:'Perfil' },
  ] : [
    { id:'inicio',        icon:'🏠', label:'Inicio' },
    { id:'solicitudes',   icon:'🏖️', label:'Vacaciones' },
    { id:'permisos',      icon:'📄', label:'Permisos' },
    { id:'incapacidades', icon:'🏥', label:'Incapacidad' },
    { id:'perfil',        icon:'👤', label:'Perfil' },
  ];

  const TITULOS = {
    inicio: esAdmin ? 'Dashboard' : 'Mis Vacaciones',
    solicitudes: esAdmin ? 'Solicitudes' : 'Vacaciones',
    permisos: 'Permisos',
    incapacidades: 'Incapacidades',
    perfil: 'Mi Perfil',
    calendario: 'Calendario',
    personal: 'Personal SITT',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', paddingBottom:72 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#4A0A1E,#6B0F2B)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(107,15,43,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/vacaciones-frontend/escudo-sitt.png" alt="" style={{ width:30, height:30, objectFit:'contain' }}/>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#C9A84C' }}>{TITULOS[seccion]}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontFamily:'Montserrat,sans-serif' }}>SITT · Ayto. Tijuana</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {usuario?.foto_url
            ? <img src={usuario.foto_url} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid #C9A84C' }} onClick={()=>setSeccion('perfil')}/>
            : <div onClick={()=>setSeccion('perfil')} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'2px solid #C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, cursor:'pointer' }}>👤</div>
          }
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding:'14px', minHeight:'calc(100vh - 130px)' }}>
        {seccion==='inicio'        && <MobileDashboard setSeccion={setSeccion}/>}
        {seccion==='solicitudes'   && <MobileSolicitudes />}
        {seccion==='permisos'      && <MobilePermisos />}
        {seccion==='incapacidades' && <MobileIncapacidades />}
        {seccion==='perfil'        && <MobilePerfil />}
        {seccion==='calendario'    && <MobileCalendario />}
        {seccion==='personal'      && <MobilePersonal setSeccion={setSeccion}/>}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1.5px solid #f0f0f0', display:'flex', zIndex:100, boxShadow:'0 -4px 24px rgba(0,0,0,0.1)', height:58 }}>
        {NAV.map(item => (
          <button key={item.id} onClick={()=>setSeccion(item.id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', gap:2, padding:'6px 2px', position:'relative' }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:seccion===item.id?'#6B0F2B':'#9ca3af', transition:'color 0.2s' }}>
              {item.label}
            </span>
            {seccion===item.id && <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:2.5, background:'#6B0F2B', borderRadius:2 }}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}
