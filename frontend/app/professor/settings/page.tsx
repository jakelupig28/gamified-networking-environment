"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function ProfessorSettings() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    institutionalEmail: "",
    department: "",
    age: "",
    gender: "Male",
    address: "",
    birthdate: "",
    subjectHandles: "",
  });
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    // Try to load initial name from localStorage if available
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      const parts = savedName.split(" ");
      const lastName = parts.length > 1 ? parts.pop() : "";
      const firstName = parts.join(" ");
      setFormData(prev => ({
        ...prev,
        firstName: firstName || "",
        lastName: lastName || ""
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
      
      // Attempt to immediately update the sidebar image if it exists in the DOM
      const sidebarImg = document.getElementById('sidebar-profile-pic') as HTMLImageElement;
      if (sidebarImg) {
        sidebarImg.src = imageUrl;
        sidebarImg.style.display = 'block';
      }
      const headerImg = document.getElementById('header-profile-pic') as HTMLImageElement;
      if (headerImg) {
        headerImg.src = imageUrl;
        headerImg.style.display = 'block';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update local storage name so it reflects across the app immediately
    const newFullName = `${formData.title ? formData.title + ' ' : ''}${formData.firstName} ${formData.lastName}`.trim();
    if (newFullName) {
      localStorage.setItem("userName", newFullName);
      // Reload page to reflect name change in sidebar
      window.location.reload();
    } else {
      alert("Profile information updated successfully.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pl-64 flex flex-col">
      <Sidebar activePath="/professor/settings" />
      <main className="p-8 flex-grow w-full max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-brand-muted text-sm">Manage your personal and academic profile.</p>
        </header>

        <div className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 border-b border-brand-border/50 pb-4">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded border border-brand-border overflow-hidden bg-brand-bg shrink-0">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-brand-muted to-brand-cyan/20"></div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-brand-text file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand-cyan file:text-brand-bg hover:file:bg-brand-cyan-hover"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Age</label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors appointment-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Birthdate</label>
                <input 
                  type="date" 
                  name="birthdate" 
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors styling-color-scheme"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Complete Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Contact Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Institutional Email</label>
                <input 
                  type="email" 
                  name="institutionalEmail" 
                  value={formData.institutionalEmail}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">College Department</label>
                <input 
                  type="text" 
                  name="department" 
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text mb-2 block">Subject Handles</label>
                <input 
                  type="text" 
                  name="subjectHandles" 
                  value={formData.subjectHandles}
                  onChange={handleChange}
                  placeholder="e.g. CS101, IT202"
                  className="w-full bg-brand-bg border border-brand-border rounded p-3 text-sm focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg font-bold py-2.5 px-6 rounded transition-colors">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}