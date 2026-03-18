import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding, FaEdit, FaTrash, FaPlus, FaCamera,
  FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt,
  FaUpload, FaTimes, FaSpinner, FaExclamationTriangle,
  FaEye, FaSave, FaWifi,
  FaParking, FaSwimmingPool, FaDumbbell, FaUtensils,
  FaTv, FaSnowflake, FaFire, FaCoffee, FaLock,
  FaList, FaCheck, FaImage, FaArrowLeft, FaThLarge
} from "react-icons/fa";
import { toast, Toaster } from 'react-hot-toast';
import api, { IMAGE_BASE_URL } from "../services/api";

/* ─── amenity config ─────────────────────────────────────────── */
const AMENITIES = [
  { value: "wifi",      label: "WiFi",       icon: <FaWifi /> },
  { value: "parking",   label: "Parking",    icon: <FaParking /> },
  { value: "pool",      label: "Pool",       icon: <FaSwimmingPool /> },
  { value: "gym",       label: "Gym",        icon: <FaDumbbell /> },
  { value: "kitchen",   label: "Kitchen",    icon: <FaUtensils /> },
  { value: "tv",        label: "Smart TV",   icon: <FaTv /> },
  { value: "ac",        label: "A/C",        icon: <FaSnowflake /> },
  { value: "fireplace", label: "Fireplace",  icon: <FaFire /> },
  { value: "breakfast", label: "Breakfast",  icon: <FaCoffee /> },
  { value: "security",  label: "Security",   icon: <FaLock /> },
];

const PROPERTY_TYPES = ["apartment","villa","house","studio","penthouse","cottage"];

const BLANK = {
  name:"", type:"apartment", price:"", location:"", description:"",
  coverImage:null, coverPreview:"", galleryImages:[], galleryPreviews:[],
  amenities:[], rooms:1, bathrooms:1, maxGuests:2, area:"",
};

const getImageUrl = (p) => {
  if (p?.cover_image) return p.cover_image.startsWith("http") ? p.cover_image : `${IMAGE_BASE_URL}${p.cover_image}`;
  if (p?.images?.length) { const u = p.images[0]; return u.startsWith("http") ? u : `${IMAGE_BASE_URL}${u}`; }
  return "/default-property.jpg";
};

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > 1920) { h *= 1920/w; w = 1920; }
      if (h > 1080) { w *= 1080/h; h = 1080; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type:"image/jpeg", lastModified:Date.now() })), "image/jpeg", 0.85);
    };
  };
});

/* ══════════════════════════════════════════════════════════════ */
const AdminPropertiesTab = ({ onRefreshStats }) => {
  const [properties,    setProperties]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [viewMode,      setViewMode]      = useState("grid");
  const [selectedProp,  setSelectedProp]  = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [modal,         setModal]         = useState(null);
  const [form,          setForm]          = useState(BLANK);
  const [uploading,     setUploading]     = useState(false);
  const [uploadProg,    setUploadProg]    = useState({ current:0, total:0, pct:0, status:"" });
  const [deletingImgId, setDeletingImgId] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try { const r = await api.properties.getAll(); setProperties(r.data || []); }
    catch { toast.error("Failed to load properties"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProperties(); }, []);

  const cleanBlobs = useCallback(() => {
    if (form.coverPreview?.startsWith("blob:")) URL.revokeObjectURL(form.coverPreview);
    form.galleryPreviews.forEach(u => u?.startsWith("blob:") && URL.revokeObjectURL(u));
  }, [form.coverPreview, form.galleryPreviews]);
  useEffect(() => () => cleanBlobs(), [cleanBlobs]);

  const resetForm = () => { cleanBlobs(); setForm(BLANK); };
  const closeModal = () => { resetForm(); setModal(null); setSelectedProp(null); };

  const handleCoverUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (form.coverPreview?.startsWith("blob:")) URL.revokeObjectURL(form.coverPreview);
    setForm(p => ({ ...p, coverImage:f, coverPreview:URL.createObjectURL(f) }));
    toast.success("Cover selected", { icon:"📸", duration:2000 });
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(p => ({ ...p, galleryImages:[...p.galleryImages,...files], galleryPreviews:[...p.galleryPreviews,...files.map(f=>URL.createObjectURL(f))] }));
    toast.success(`${files.length} image(s) added`, { icon:"🖼️", duration:2000 });
  };

  const removeNewGallery = (i) => {
    const url = form.galleryPreviews[i];
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    const gi = [...form.galleryImages]; gi.splice(i,1);
    const gp = [...form.galleryPreviews]; gp.splice(i,1);
    setForm(p => ({ ...p, galleryImages:gi, galleryPreviews:gp }));
  };

  const deletePropertyImage = async (imageUrl, propertyId) => {
    const m = imageUrl.match(/\/property-image\/(\d+)/);
    if (!m) { toast.error("Invalid image URL"); return; }
    const imageId = m[1];
    setDeletingImgId(imageId);
    const tid = toast.loading("Deleting image…");
    try {
      await api.admin.deletePropertyImage(imageId);
      toast.dismiss(tid); toast.success("Image deleted", { icon:"🗑️", duration:3000 });
      const r = await api.properties.getById(propertyId);
      const up = r.data;
      setForm(p => ({
        ...p,
        coverPreview: up.cover_image ? (up.cover_image.startsWith("http") ? up.cover_image : `${IMAGE_BASE_URL}${up.cover_image}`) : "",
        galleryPreviews: (up.images||[]).slice(1).map(img => img.startsWith("http") ? img : `${IMAGE_BASE_URL}${img}`),
      }));
      await fetchProperties(); onRefreshStats?.();
    } catch (err) { toast.dismiss(tid); toast.error(err.response?.data?.error || "Failed to delete image"); }
    finally { setDeletingImgId(null); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.price || !form.location) { toast.error("Fill required fields"); return; }
    const tid = toast.loading("Creating property…");
    try {
      setUploading(true);
      const total = 1 + (form.coverImage?1:0) + form.galleryImages.length;
      setUploadProg({ current:0, total, pct:0, status:"Creating property…" });
      const r = await api.admin.createProperty({
        name:form.name, type:form.type, price:parseFloat(form.price),
        location:form.location, description:form.description,
        rooms:form.rooms, bathrooms:form.bathrooms, max_guests:form.maxGuests,
        area:form.area, amenities:form.amenities,
        specs:{ guests:form.maxGuests, bedrooms:form.rooms, beds:form.rooms, bathrooms:form.bathrooms },
        status:"active",
      });
      const pid = r.data.id;
      toast.loading("Uploading images…", { id:tid });
      setUploadProg(p => ({ ...p, current:1, pct:Math.round((1/total)*100), status:"Uploading images…" }));
      if (form.coverImage) {
        const cf = await compressImage(form.coverImage);
        const fd = new FormData(); fd.append("coverImage", cf);
        await api.admin.addPropertyImages(pid, fd);
        setUploadProg(p => ({ ...p, current:p.current+1, pct:Math.round(((p.current+1)/p.total)*100) }));
      }
      for (const img of form.galleryImages) {
        const cf = await compressImage(img);
        const fd = new FormData(); fd.append("galleryImages", cf);
        await api.admin.addPropertyImages(pid, fd);
        setUploadProg(p => ({ ...p, current:p.current+1, pct:Math.round(((p.current+1)/p.total)*100) }));
      }
      cleanBlobs(); resetForm(); closeModal(); setUploading(false);
      await fetchProperties(); onRefreshStats?.();
      toast.success("Property created!", { id:tid, icon:"🎉", duration:5000 });
    } catch (err) { toast.error(err.response?.data?.error || "Failed to create property", { id:tid }); setUploading(false); }
  };

  const handleUpdate = async () => {
    const tid = toast.loading("Updating property…");
    try {
      setUploading(true);
      const total = 1 + (form.coverImage?1:0) + form.galleryImages.length;
      setUploadProg({ current:0, total, pct:0, status:"Updating property…" });
      await api.admin.updateProperty(selectedProp.id, {
        name:form.name, type:form.type, price:parseFloat(form.price),
        location:form.location, description:form.description,
        rooms:form.rooms, bathrooms:form.bathrooms, max_guests:form.maxGuests,
        area:form.area, amenities:form.amenities,
      });
      toast.loading("Uploading new images…", { id:tid });
      setUploadProg(p => ({ ...p, current:1, pct:Math.round((1/total)*100), status:"Uploading new images…" }));
      if (form.coverImage) {
        const cf = await compressImage(form.coverImage);
        const fd = new FormData(); fd.append("coverImage", cf);
        await api.admin.addPropertyImages(selectedProp.id, fd);
        setUploadProg(p => ({ ...p, current:p.current+1, pct:Math.round(((p.current+1)/p.total)*100) }));
      }
      for (const img of form.galleryImages) {
        const cf = await compressImage(img);
        const fd = new FormData(); fd.append("galleryImages", cf);
        await api.admin.addPropertyImages(selectedProp.id, fd);
        setUploadProg(p => ({ ...p, current:p.current+1, pct:Math.round(((p.current+1)/p.total)*100) }));
      }
      cleanBlobs(); closeModal(); setUploading(false);
      await fetchProperties(); onRefreshStats?.();
      toast.success("Property updated!", { id:tid, icon:"✅", duration:5000 });
    } catch (err) { toast.error(err.response?.data?.error || "Failed to update property", { id:tid }); setUploading(false); }
  };

  const handleDelete = async (id) => {
    const tid = toast.loading("Deleting…");
    try {
      await api.admin.deleteProperty(id);
      await fetchProperties(); onRefreshStats?.();
      setDeleteTarget(null);
      toast.success("Property deleted", { id:tid, icon:"🗑️", duration:3000 });
    } catch { toast.error("Failed to delete property", { id:tid }); }
  };

  const openEdit = (p) => {
    setSelectedProp(p);
    setForm({
      name:p.name, type:p.type, price:p.price, location:p.location, description:p.description||"",
      coverImage:null,
      coverPreview:p.cover_image ? (p.cover_image.startsWith("http") ? p.cover_image : `${IMAGE_BASE_URL}${p.cover_image}`) : "",
      galleryImages:[],
      galleryPreviews:(p.images||[]).slice(1).map(img => img.startsWith("http") ? img : `${IMAGE_BASE_URL}${img}`),
      amenities:p.amenities||[], rooms:p.rooms||1, bathrooms:p.bathrooms||1, maxGuests:p.max_guests||2, area:p.area||"",
    });
    setModal("edit");
  };
  const openView = (p) => { setSelectedProp(p); setModal("view"); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#093A3E] flex items-center justify-center shadow-lg">
          <FaSpinner className="animate-spin text-white text-2xl" />
        </div>
        <p className="text-sm font-medium text-stone-400 tracking-widest uppercase" style={{fontFamily:"'DM Sans',system-ui"}}>Loading properties</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .f-display{font-family:'Cormorant Garamond',Georgia,serif}
        .f-body{font-family:'DM Sans',system-ui,sans-serif}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        .prop-img{transition:transform .6s cubic-bezier(.25,.46,.45,.94)}
        .prop-card:hover .prop-img{transform:scale(1.07)}
        .input-base{width:100%;padding:.625rem 1rem;border:1.5px solid #E8E6E1;border-radius:.75rem;font-family:'DM Sans',system-ui;font-size:.875rem;outline:none;transition:border-color .2s;background:#fff;color:#1C2321}
        .input-base:focus{border-color:#093A3E}
      `}</style>

      <Toaster position="top-right" toastOptions={{
        duration:4000,
        style:{fontFamily:"'DM Sans',system-ui",fontSize:14,borderRadius:12,boxShadow:"0 8px 30px rgba(0,0,0,.12)",border:"1px solid rgba(0,0,0,.06)"},
        success:{style:{borderLeft:"3px solid #10b981"}},
        error:{style:{borderLeft:"3px solid #ef4444"}},
        loading:{style:{borderLeft:"3px solid #f59e0b"}},
      }}/>

      {/* Upload overlay */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div initial={{scale:.9,y:20}} animate={{scale:1,y:0}}
              className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#093A3E] flex items-center justify-center flex-shrink-0">
                  <FaSpinner className="animate-spin text-white text-lg" />
                </div>
                <div>
                  <p className="f-body font-medium text-[#1C2321]">{uploadProg.status}</p>
                  <p className="f-body text-sm text-stone-400">{uploadProg.current} / {uploadProg.total} steps</p>
                </div>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#093A3E] rounded-full" initial={{width:0}}
                  animate={{width:`${uploadProg.pct}%`}} transition={{duration:.3}}/>
              </div>
              <p className="f-body text-xs text-stone-400 mt-2 text-right">{uploadProg.pct}%</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="f-display text-3xl sm:text-4xl text-[#1C2321] leading-none">Properties</h1>
            <p className="f-body text-sm text-stone-400 mt-1">{properties.length} listing{properties.length!==1?"s":""}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              {[["grid",<FaThLarge/>],["list",<FaList/>]].map(([m,icon])=>(
                <button key={m} onClick={()=>setViewMode(m)}
                  className={`px-3 py-2.5 text-sm transition-colors ${viewMode===m?"bg-[#093A3E] text-white":"text-stone-400 hover:text-[#093A3E]"}`}>
                  {icon}
                </button>
              ))}
            </div>
            <motion.button whileTap={{scale:.97}}
              onClick={()=>{resetForm();setModal("add");}}
              className="flex items-center gap-2 bg-[#093A3E] text-white px-4 py-2.5 rounded-xl f-body text-sm font-medium shadow-lg shadow-teal-900/20 hover:bg-[#0a4a52] transition-colors">
              <FaPlus className="text-[#ED9B40]"/>
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>

        {/* Empty state */}
        {properties.length===0 ? (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-stone-200">
            <div className="w-20 h-20 rounded-2xl bg-[#F5F4F0] flex items-center justify-center mb-6">
              <FaBuilding className="text-3xl text-stone-300"/>
            </div>
            <h3 className="f-display text-2xl text-stone-700 mb-2">No properties yet</h3>
            <p className="f-body text-stone-400 mb-8 text-sm text-center max-w-xs">Start building your portfolio by adding your first property listing.</p>
            <motion.button whileTap={{scale:.97}} onClick={()=>{resetForm();setModal("add");}}
              className="flex items-center gap-2 bg-[#093A3E] text-white px-6 py-3 rounded-xl f-body text-sm font-medium">
              <FaPlus className="text-[#ED9B40]"/> Add Property
            </motion.button>
          </motion.div>
        ) : viewMode==="grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.map((p,idx)=>(
              <motion.div key={p.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*.05}}
                className="prop-card bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
                <div className="relative h-52 overflow-hidden bg-stone-100">
                  <img src={getImageUrl(p)} alt={p.name} className="prop-img w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <button onClick={()=>openView(p)} className="text-white text-xs f-body font-medium flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                      <FaEye size={11}/> Quick view
                    </button>
                    <div className="flex gap-2">
                      <button onClick={()=>openEdit(p)} className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center transition-colors"><FaEdit size={12}/></button>
                      <button onClick={()=>setDeleteTarget(p.id)} className="w-8 h-8 rounded-lg bg-red-500/70 backdrop-blur-sm hover:bg-red-600/80 text-white flex items-center justify-center transition-colors"><FaTrash size={12}/></button>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
                    <span className="f-display text-sm font-semibold text-[#093A3E]">Ksh {p.price?.toLocaleString()}</span>
                    <span className="f-body text-[10px] text-stone-400">/night</span>
                  </div>
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] f-body font-medium ${p.status==="active"?"bg-emerald-500/90 text-white":"bg-stone-500/80 text-white"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>
                    {p.status||"Active"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="f-display text-xl leading-tight cursor-pointer hover:text-[#093A3E] transition-colors mb-1" onClick={()=>openView(p)}>{p.name}</h3>
                  <p className="f-body text-xs text-stone-400 flex items-center gap-1 mb-4"><FaMapMarkerAlt className="text-[#ED9B40]"/> {p.location}</p>
                  <div className="flex items-center gap-4 text-xs f-body text-stone-500 border-t border-stone-100 pt-4">
                    <span className="flex items-center gap-1.5"><FaBed className="text-stone-300"/> <strong className="text-stone-700">{p.rooms}</strong> bed</span>
                    <span className="flex items-center gap-1.5"><FaBath className="text-stone-300"/> <strong className="text-stone-700">{p.bathrooms}</strong> bath</span>
                    {p.area&&<span className="flex items-center gap-1.5"><FaRulerCombined className="text-stone-300"/> <strong className="text-stone-700">{p.area}</strong> ft²</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_100px] gap-4 px-6 py-3 bg-stone-50 border-b border-stone-100">
              {["Property","Location","Price","Specs","Status",""].map((h,i)=>(
                <span key={i} className="f-body text-[10px] uppercase tracking-widest text-stone-400 font-medium">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-stone-100">
              {properties.map((p,idx)=>(
                <motion.div key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:idx*.04}}
                  className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_80px_100px] gap-2 md:gap-4 px-4 md:px-6 py-4 hover:bg-stone-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                      <img src={getImageUrl(p)} alt={p.name} className="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <p className="f-display text-lg leading-tight">{p.name}</p>
                      <p className="f-body text-xs text-stone-400 md:hidden flex items-center gap-1"><FaMapMarkerAlt className="text-[#ED9B40]" size={10}/> {p.location}</p>
                    </div>
                  </div>
                  <p className="hidden md:block f-body text-sm text-stone-500 self-center">{p.location}</p>
                  <p className="hidden md:block f-display text-base text-[#093A3E] self-center">Ksh {p.price?.toLocaleString()}</p>
                  <div className="hidden md:flex items-center gap-3 text-xs f-body text-stone-500 self-center">
                    <span><FaBed className="inline mr-1 text-stone-300"/>{p.rooms}</span>
                    <span><FaBath className="inline mr-1 text-stone-300"/>{p.bathrooms}</span>
                  </div>
                  <div className="flex items-center justify-between md:hidden text-xs f-body text-stone-500">
                    <span className="f-display text-sm text-[#093A3E]">Ksh {p.price?.toLocaleString()}</span>
                    <span className="flex gap-3">
                      <span><FaBed className="inline mr-1 text-stone-300"/>{p.rooms}</span>
                      <span><FaBath className="inline mr-1 text-stone-300"/>{p.bathrooms}</span>
                    </span>
                  </div>
                  <div className="flex items-center self-center">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] f-body font-medium px-2 py-1 rounded-lg ${p.status==="active"?"bg-emerald-50 text-emerald-700":"bg-stone-100 text-stone-500"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"/>{p.status||"Active"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 self-center justify-end">
                    <button onClick={()=>openView(p)} className="w-8 h-8 rounded-lg text-stone-300 hover:text-[#093A3E] hover:bg-stone-100 flex items-center justify-center transition-colors"><FaEye size={13}/></button>
                    <button onClick={()=>openEdit(p)} className="w-8 h-8 rounded-lg text-stone-300 hover:text-[#093A3E] hover:bg-stone-100 flex items-center justify-center transition-colors"><FaEdit size={13}/></button>
                    <button onClick={()=>setDeleteTarget(p.id)} className="w-8 h-8 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"><FaTrash size={13}/></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={()=>setDeleteTarget(null)}>
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,y:20}}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-2xl"
              onClick={e=>e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <FaExclamationTriangle className="text-red-500 text-xl"/>
              </div>
              <h3 className="f-display text-2xl mb-2">Delete property?</h3>
              <p className="f-body text-sm text-stone-400 mb-8">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={()=>setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl f-body text-sm hover:bg-stone-50 transition-colors">Cancel</button>
                <button onClick={()=>handleDelete(deleteTarget)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl f-body text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  <FaTrash size={12}/> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {(modal==="add"||modal==="edit")&&(
          <PropertyFormModal
            title={modal==="edit"?"Edit Property":"New Property"}
            isEdit={modal==="edit"}
            form={form} setForm={setForm}
            onSave={modal==="edit"?handleUpdate:handleCreate}
            onCancel={closeModal}
            onCoverUpload={handleCoverUpload}
            onGalleryUpload={handleGalleryUpload}
            onRemoveNewGallery={removeNewGallery}
            onDeleteImage={(url)=>deletePropertyImage(url,selectedProp?.id)}
            deletingImgId={deletingImgId}
          />
        )}
      </AnimatePresence>

      {/* View modal */}
      <AnimatePresence>
        {modal==="view"&&selectedProp&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={closeModal}>
            <motion.div initial={{scale:.95,y:30}} animate={{scale:1,y:0}} exit={{scale:.95,y:30}}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto scrollbar-hide shadow-2xl">
              <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-2xl">
                <img src={getImageUrl(selectedProp)} alt={selectedProp.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>
                <button onClick={closeModal} className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"><FaArrowLeft size={14}/></button>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="f-display text-3xl text-white leading-tight">{selectedProp.name}</p>
                    <p className="f-body text-sm text-white/70 flex items-center gap-1 mt-1"><FaMapMarkerAlt className="text-[#ED9B40]"/>{selectedProp.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="f-display text-2xl text-white">Ksh {selectedProp.price?.toLocaleString()}</p>
                    <p className="f-body text-xs text-white/60">per night</p>
                  </div>
                </div>
              </div>
              {(selectedProp.images||[]).length>1&&(
                <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
                  {(selectedProp.images||[]).slice(1,6).map((img,i)=>(
                    <div key={i} className="w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
                      <img src={img.startsWith("http")?img:`${IMAGE_BASE_URL}${img}`} alt="" className="w-full h-full object-cover"/>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-5 space-y-6">
                <div className="flex flex-wrap gap-3">
                  {[[<FaBed/>,`${selectedProp.rooms} bedrooms`],[<FaBath/>,`${selectedProp.bathrooms} bathrooms`],[<FaBuilding/>,`${selectedProp.max_guests} guests`],selectedProp.area&&[<FaRulerCombined/>,`${selectedProp.area} ft²`]].filter(Boolean).map(([icon,label],i)=>(
                    <div key={i} className="flex items-center gap-2 bg-[#F5F4F0] px-3 py-2 rounded-xl">
                      <span className="text-[#ED9B40] text-xs">{icon}</span>
                      <span className="f-body text-xs text-stone-600">{label}</span>
                    </div>
                  ))}
                </div>
                {selectedProp.description&&(
                  <div>
                    <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-2">Description</p>
                    <p className="f-body text-sm text-stone-600 leading-relaxed">{selectedProp.description}</p>
                  </div>
                )}
                {selectedProp.amenities?.length>0&&(
                  <div>
                    <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProp.amenities.map((a,i)=>{
                        const found=AMENITIES.find(x=>x.value===a);
                        return <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#093A3E]/5 text-[#093A3E] rounded-xl text-xs f-body">{found?.icon} {found?.label||a}</span>;
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button onClick={closeModal} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl f-body text-sm hover:bg-stone-50 transition-colors">Close</button>
                  <button onClick={()=>{closeModal();openEdit(selectedProp);}}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#093A3E] text-white rounded-xl f-body text-sm font-medium hover:bg-[#0a4a52] transition-colors">
                    <FaEdit size={12}/> Edit Property
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
const STEPS = ["Basic Info","Details","Images","Amenities"];

const PropertyFormModal = ({ title, isEdit, form, setForm, onSave, onCancel, onCoverUpload, onGalleryUpload, onRemoveNewGallery, onDeleteImage, deletingImgId }) => {
  const [step,setSaving_step] = useState(0);
  const [saving,setSaving]    = useState(false);
  const setStep = setSaving_step;

  const handleSave = async () => { setSaving(true); await onSave(); setSaving(false); };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onCancel}>
      <motion.div initial={{scale:.95,y:30}} animate={{scale:1,y:0}} exit={{scale:.95,y:30}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[96vh] overflow-hidden flex flex-col shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
          <div>
            <h3 className="f-display text-2xl">{title}</h3>
            <p className="f-body text-xs text-stone-400 mt-0.5">{STEPS[step]} · Step {step+1} of {STEPS.length}</p>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-400"><FaTimes/></button>
        </div>

        {/* step dots */}
        <div className="flex px-6 py-3 gap-1.5 flex-shrink-0">
          {STEPS.map((_,i)=>(
            <div key={i} className="flex-1 flex flex-col gap-1 cursor-pointer" onClick={()=>i<step&&setStep(i)}>
              <div className={`h-1 rounded-full transition-colors duration-300 ${i<=step?"bg-[#093A3E]":"bg-stone-100"}`}/>
              <span className={`f-body text-[10px] text-center transition-colors ${i===step?"text-[#093A3E] font-medium":"text-stone-300"}`}>{STEPS[i]}</span>
            </div>
          ))}
        </div>

        {/* body */}
        <div className="overflow-y-auto scrollbar-hide flex-1 px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.2}}>
              {step===0&&<StepBasic form={form} setForm={setForm}/>}
              {step===1&&<StepDetails form={form} setForm={setForm}/>}
              {step===2&&<StepImages form={form} setForm={setForm} onCoverUpload={onCoverUpload} onGalleryUpload={onGalleryUpload} onRemoveNewGallery={onRemoveNewGallery} onDeleteImage={onDeleteImage} deletingImgId={deletingImgId}/>}
              {step===3&&<StepAmenities form={form} setForm={setForm}/>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/80 flex-shrink-0">
          <button onClick={()=>step>0?setStep(s=>s-1):onCancel()}
            className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 bg-white rounded-xl f-body text-sm hover:bg-stone-50 transition-colors">
            {step>0?"← Back":"Cancel"}
          </button>
          {step<STEPS.length-1?(
            <button onClick={()=>setStep(s=>s+1)}
              disabled={step===0&&(!form.name||!form.price||!form.location)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#093A3E] text-white rounded-xl f-body text-sm font-medium hover:bg-[#0a4a52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          ):(
            <button onClick={handleSave}
              disabled={!form.name||!form.price||!form.location||saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#093A3E] text-white rounded-xl f-body text-sm font-medium hover:bg-[#0a4a52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[140px] justify-center">
              {saving?<><FaSpinner className="animate-spin"/>{isEdit?"Updating…":"Creating…"}</>:<><FaSave size={12}/>{isEdit?"Update Property":"Create Property"}</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const StepBasic = ({ form, setForm }) => (
  <div className="space-y-5">
    <div className="space-y-1.5">
      <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Property Name *</label>
      <input type="text" value={form.name} placeholder="e.g. The Kensington Suite" onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-base"/>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Type</label>
        <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="input-base">
          {PROPERTY_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Price / Night (Ksh) *</label>
        <input type="number" value={form.price} placeholder="0" onChange={e=>setForm(p=>({...p,price:e.target.value}))} className="input-base"/>
      </div>
    </div>
    <div className="space-y-1.5">
      <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Location *</label>
      <input type="text" value={form.location} placeholder="District, City" onChange={e=>setForm(p=>({...p,location:e.target.value}))} className="input-base"/>
    </div>
    <div className="space-y-1.5">
      <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Description</label>
      <textarea value={form.description} rows={4} placeholder="Tell guests what makes this place special…" onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input-base resize-none"/>
    </div>
  </div>
);

const StepDetails = ({ form, setForm }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4">
      {[{key:"rooms",label:"Bedrooms",icon:"🛏️"},{key:"bathrooms",label:"Bathrooms",icon:"🚿"},{key:"maxGuests",label:"Max Guests",icon:"👥"}].map(({key,label,icon})=>(
        <div key={key} className="bg-[#F5F4F0] rounded-2xl p-4 flex flex-col items-center gap-3">
          <span className="text-xl">{icon}</span>
          <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 text-center">{label}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={()=>setForm(p=>({...p,[key]:Math.max(1,(p[key]||1)-1)}))}
              className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50 transition-colors f-body font-bold">−</button>
            <span className="f-display text-xl w-6 text-center">{form[key]||1}</span>
            <button type="button" onClick={()=>setForm(p=>({...p,[key]:(p[key]||1)+1}))}
              className="w-7 h-7 rounded-lg bg-[#093A3E] text-white flex items-center justify-center hover:bg-[#0a4a52] transition-colors f-body font-bold">+</button>
          </div>
        </div>
      ))}
    </div>
    <div className="space-y-1.5">
      <label className="f-body text-[10px] uppercase tracking-widest text-stone-400">Area (ft²)</label>
      <input type="text" value={form.area} placeholder="e.g. 1,200" onChange={e=>setForm(p=>({...p,area:e.target.value}))} className="input-base"/>
    </div>
  </div>
);

const StepImages = ({ form, setForm, onCoverUpload, onGalleryUpload, onRemoveNewGallery, onDeleteImage, deletingImgId }) => (
  <div className="space-y-6">
    <div>
      <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Cover Image</p>
      <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={onCoverUpload}/>
      {form.coverPreview?(
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden group">
          <img src={form.coverPreview} alt="Cover" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label htmlFor="cover-upload" className="cursor-pointer flex items-center gap-2 bg-white/90 text-stone-800 px-4 py-2 rounded-xl text-xs f-body font-medium hover:bg-white transition-colors">
              <FaCamera/> Change
            </label>
            <button type="button"
              onClick={()=>{
                if(form.coverPreview.startsWith("blob:")){URL.revokeObjectURL(form.coverPreview);setForm(p=>({...p,coverImage:null,coverPreview:""}));}
                else{onDeleteImage(form.coverPreview);}
              }}
              disabled={!!deletingImgId}
              className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-xl text-xs f-body font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
              {deletingImgId?<FaSpinner className="animate-spin"/>:<FaTrash/>} Remove
            </button>
          </div>
        </div>
      ):(
        <label htmlFor="cover-upload"
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-200 rounded-2xl aspect-video cursor-pointer hover:border-[#093A3E] hover:bg-[#F5F4F0] transition-all group">
          <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-white flex items-center justify-center transition-colors">
            <FaCamera className="text-stone-300 group-hover:text-[#093A3E] text-xl transition-colors"/>
          </div>
          <div className="text-center">
            <p className="f-body text-sm text-stone-500 group-hover:text-[#093A3E] transition-colors font-medium">Upload Cover Image</p>
            <p className="f-body text-xs text-stone-300 mt-0.5">JPG, PNG up to 10MB</p>
          </div>
        </label>
      )}
    </div>
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="f-body text-[10px] uppercase tracking-widest text-stone-400">Gallery Images</p>
        <label htmlFor="gallery-upload" className="cursor-pointer flex items-center gap-1.5 text-xs f-body font-medium text-[#093A3E] bg-[#093A3E]/5 px-3 py-1.5 rounded-lg hover:bg-[#093A3E]/10 transition-colors">
          <FaPlus size={10}/> Add images
        </label>
        <input type="file" id="gallery-upload" accept="image/*" multiple className="hidden" onChange={onGalleryUpload}/>
      </div>
      {form.galleryPreviews.length===0?(
        <label htmlFor="gallery-upload"
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-100 rounded-2xl py-8 cursor-pointer hover:border-stone-200 transition-colors">
          <FaImage className="text-stone-200 text-2xl"/>
          <p className="f-body text-xs text-stone-300">No gallery images yet</p>
        </label>
      ):(
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {form.galleryPreviews.map((url,i)=>{
            const imgId=url.match(/\/property-image\/(\d+)/)?.[1];
            const isDeleting=deletingImgId===imgId;
            return (
              <motion.div key={i} initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:i*.04}}
                className="relative aspect-square rounded-xl overflow-hidden group bg-stone-100">
                <img src={url} alt="" className="w-full h-full object-cover"/>
                {!url.startsWith("blob:")&&<div className="absolute top-1.5 left-1.5 bg-[#093A3E]/80 text-white text-[8px] px-1.5 py-0.5 rounded f-body">saved</div>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={()=>url.startsWith("blob:")?onRemoveNewGallery(i):onDeleteImage(url)} disabled={isDeleting}
                    className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50">
                    {isDeleting?<FaSpinner className="animate-spin" size={11}/>:<FaTrash size={11}/>}
                  </button>
                </div>
              </motion.div>
            );
          })}
          <label htmlFor="gallery-upload"
            className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:border-[#093A3E] hover:bg-[#F5F4F0] transition-all group">
            <FaPlus className="text-stone-300 group-hover:text-[#093A3E] transition-colors text-lg"/>
          </label>
        </div>
      )}
    </div>
  </div>
);

const StepAmenities = ({ form, setForm }) => {
  const [customInput, setCustomInput] = useState("");

  const presetValues = AMENITIES.map(a => a.value);

  const toggle = (v) => setForm(p => ({
    ...p,
    amenities: p.amenities.includes(v) ? p.amenities.filter(a => a !== v) : [...p.amenities, v]
  }));

  const addCustom = () => {
    const val = customInput.trim().toLowerCase();
    if (!val) return;
    if (form.amenities.includes(val)) {
      toast("Already added!", { icon: "⚠️", duration: 1500 });
      return;
    }
    setForm(p => ({ ...p, amenities: [...p.amenities, val] }));
    setCustomInput("");
  };

  const removeAmenity = (v) => setForm(p => ({ ...p, amenities: p.amenities.filter(a => a !== v) }));

  // custom amenities = those not in the preset list
  const customAmenities = form.amenities.filter(a => !presetValues.includes(a));

  return (
    <div className="space-y-6">
      {/* Preset toggles */}
      <div>
        <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Quick select</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AMENITIES.map(a => {
            const on = form.amenities.includes(a.value);
            return (
              <motion.button key={a.value} type="button" onClick={() => toggle(a.value)} whileTap={{ scale: .97 }}
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left ${on ? "bg-[#093A3E] border-[#093A3E] text-white shadow-md shadow-teal-900/15" : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"}`}>
                <span className={`text-base ${on ? "text-[#ED9B40]" : "text-stone-300"}`}>{a.icon}</span>
                <span className="f-body text-xs font-medium">{a.label}</span>
                {on && <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#ED9B40] flex items-center justify-center"><FaCheck size={7} className="text-white" /></span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom amenity input */}
      <div>
        <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Add custom amenity</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="e.g. Rooftop terrace, Hot tub, EV charging…"
            className="input-base flex-1"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#093A3E] text-white rounded-xl f-body text-sm font-medium hover:bg-[#0a4a52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <FaPlus size={11} /> Add
          </button>
        </div>
        <p className="f-body text-[10px] text-stone-300 mt-1.5">Press Enter or click Add to include a custom amenity</p>
      </div>

      {/* Custom amenity chips */}
      <AnimatePresence>
        {customAmenities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Custom amenities</p>
            <div className="flex flex-wrap gap-2">
              {customAmenities.map(a => (
                <motion.span key={a}
                  initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-[#ED9B40]/10 border border-[#ED9B40]/30 text-[#093A3E] rounded-xl f-body text-xs font-medium"
                >
                  ✦ {a}
                  <button type="button" onClick={() => removeAmenity(a)}
                    className="w-4 h-4 rounded-full bg-[#093A3E]/10 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors">
                    <FaTimes size={8} />
                  </button>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {form.amenities.length > 0 && (
        <p className="f-body text-xs text-stone-400 text-center">
          {form.amenities.length} amenit{form.amenities.length === 1 ? "y" : "ies"} selected
          {customAmenities.length > 0 && ` (${customAmenities.length} custom)`}
        </p>
      )}
    </div>
  );
};

export default AdminPropertiesTab;