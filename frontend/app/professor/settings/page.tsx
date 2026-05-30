"use client";

import { useState, useEffect } from "react";
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
    const email = localStorage.getItem("userEmail");
    const loadProfile = async () => {
      if (!email) return;
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.users) {
          const currentUser = data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (currentUser) {
            const parts = (currentUser.name || "").split(" ");
            let titleVal = currentUser.title || "";
            let firstNameVal = currentUser.firstName || "";
            let lastNameVal = currentUser.lastName || "";
            
            if (!firstNameVal && parts.length > 0) {
              if (["dr.", "prof.", "mr.", "ms.", "mrs."].includes(parts[0].toLowerCase())) {
                titleVal = titleVal || parts[0];
                parts.shift();
              }
              lastNameVal = parts.length > 1 ? parts.pop() : "";
              firstNameVal = parts.join(" ");
            }

            setFormData({
              firstName: firstNameVal,
              lastName: lastNameVal,
              title: titleVal,
              email: currentUser.email || email || "",
              institutionalEmail: currentUser.institutionalEmail || "",
              department: currentUser.department || "",
              age: currentUser.age || "",
              gender: currentUser.gender || "Male",
              address: currentUser.address || "",
              birthdate: currentUser.birthdate || "",
              subjectHandles: currentUser.subjectHandles || "",
            });
            if (currentUser.profilePic) {
              setProfilePic(currentUser.profilePic);
              localStorage.setItem("profilePic", currentUser.profilePic);
              window.dispatchEvent(new Event("profilePicUpdated"));
            }
          }
        }
      } catch (err) {
        console.error("Error loading professor profile:", err);
      }
    };

    loadProfile();

    const savedPic = localStorage.getItem("profilePic");
    if (savedPic) {
      setProfilePic(savedPic);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem("profilePic", base64String);
        setProfilePic(base64String);
        
        // Dispatch event so that Sidebar and Header update instantly
        window.dispatchEvent(new Event("profilePicUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem("userEmail") || formData.email;
    if (!email) {
      alert("Logged-in user email not found. Please log in again.");
      return;
    }

    const newFullName = `${formData.title ? formData.title + ' ' : ''}${formData.firstName} ${formData.lastName}`.trim();
    
    const payload = {
      email,
      newEmail: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      title: formData.title,
      institutionalEmail: formData.institutionalEmail,
      department: formData.department,
      age: formData.age,
      gender: formData.gender,
      address: formData.address,
      birthdate: formData.birthdate,
      subjectHandles: formData.subjectHandles,
      profilePic: profilePic || undefined
    };

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("userName", newFullName);
        if (formData.email) {
          localStorage.setItem("userEmail", formData.email);
        }
        if (profilePic) {
          localStorage.setItem("profilePic", profilePic);
        }
        alert("Profile updated successfully!");
        window.location.reload();
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error connecting to server. Profile not saved.");
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