import React, { useState } from 'react';

const TEACHER_PHOTOS: Record<string, string> = {
  'mohamed abdelkader': 'https://phl-p0126-mohamed-abdelkader.vercel.app/file.jpg',
  'abdullah gibreel': 'https://phy-en-bac-abdullah-gibreel.vercel.app/file.jpg',
  elsamady: 'https://math-ar-bac-elsamady.vercel.app/file.jpg',
  khalil: 'https://history-bac-khalil.vercel.app/file.jpg',
  shady: 'https://math-en-bac-shady.vercel.app/file.jpg',
  'nour essam': 'https://arabic-j-nour-essam.vercel.app/file.jpg',
  'yasmeen attallah': 'https://ss-p0155-yasmeen-attallah.vercel.app/file.jpg',
  'bosy magdy': 'https://ss-p0144-bosy-magdy.vercel.app/file.jpg',
  'mohamed aly': 'https://phl-p0026-mohamed-aly.vercel.app/file.jpg',
  'khaled barakat': 'https://math-en-p0156-khaled-barakat.vercel.app/file.jpg',
  'ahmed soliman': 'https://math-ar-p0081-ahmed-soliman.vercel.app/file.jpg',
  'eslam morsy': 'https://bio-ar-p0163-eslam-morsy.vercel.app/file.jpg',
  'elmasry': 'https://math-ar-s1-elmasry.vercel.app/file.jpg',
  'helmy mohamed': 'https://hx-p0034-helmy-mohamed.vercel.app/file.jpg',
  abanoub: 'https://english-m-abanoub.vercel.app/file.jpg',
  'ahmed abdallah': 'https://math-en-p0153-ahmed-abdallah.vercel.app/file.jpg',
  'mohamed ismail': 'https://ar-p0159-mohamed-ismail.vercel.app/file.jpg',
  'mohamed yasser': 'https://isc-ar-p0056-mohamed-yasser.vercel.app/file.jpg',
  rodaina: 'https://english-m-rodaina.vercel.app/file.jpg',
  'abdallah youssry': 'https://ar-p0141-abdallah-youssry.vercel.app/file.jpg',
  rowida: 'https://sci-en-p0158-rowida.vercel.app/file.jpg',
  'fatma ebrahim': 'https://ss-p0165-fatma-ebrahim.vercel.app/file.jpg',
  'mina fayez': 'https://sci-en-j-mina-fayez.vercel.app/file.jpg',
  'alaa abdelhakem': 'https://math-en-p0174-alaa-abdelhakem.vercel.app/file.jpg',
  'radwa youssef': 'https://ar-p0132-radwa-youssef.vercel.app/file.jpg',
  'bishoy ayman': 'https://isc-en-p0067-bishoy-ayman.vercel.app/file.jpg',
  'radwa mohamed': 'https://sci-ar-radwa-mohamed.vercel.app/file.jpg',
  'fady wageh': 'https://sci-en-p0080-fady-wageh.vercel.app/file.jpg',
  'rowan kabbary': 'https://math-ar-p0136-rowan-kabbary.vercel.app/file.jpg',
  'mohamed magdy': 'https://integrated-en-mohamed-magdy.vercel.app/file.jpg',
  'atef ramzy': 'https://en-p0161-atef-ramzy.vercel.app/file.jpg',
  'mahmoud kotb': 'https://ss-p0079-mahmoud-kotb.vercel.app/file.jpg',
  'muslim elsayed': 'https://sci-ar-p0078-muslim-elsayed.vercel.app/file.jpg',
};

const FEMALE_TEACHERS = new Set([
  'amal gamal',
  'bosy magdy',
  'doaa fatooh',
  'eman ahmed',
  'eman mohamed',
  'fatma ebrahim',
  'lamees hamdy',
  'mina fayez',
  'mona salah',
  'nada abdelnasser',
  'nada hassan',
  'radwa abdallah',
  'radwa mohamed',
  'radwa youssef',
  'rodaina',
  'rowan kabbary',
  'rowida',
  'yasmeen attallah',
]);

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00c2/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

interface TeacherAvatarProps {
  teacherName: string;
  className: string;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({ teacherName, className }) => {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const normalizedName = normalizeName(teacherName);
  const photoUrl = TEACHER_PHOTOS[normalizedName];
  const showPhoto = Boolean(photoUrl && failedPhoto !== photoUrl);
  const isFemale = FEMALE_TEACHERS.has(normalizedName);

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-white/90 shadow-sm ring-1 ring-slate-200/80 ${className}`}
      title={teacherName}
    >
      {showPhoto && photoUrl ? (
        <img
          src={photoUrl}
          alt={`${teacherName} profile`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="block h-full w-full object-cover object-center"
          onError={() => setFailedPhoto(photoUrl)}
        />
      ) : (
        <svg
          viewBox="0 0 64 64"
          role="img"
          aria-label={`${teacherName}, ${isFemale ? 'female' : 'male'} teacher avatar`}
          className={`block h-full w-full ${isFemale ? 'bg-rose-50' : 'bg-sky-50'}`}
        >
          <circle cx="32" cy="32" r="32" fill={isFemale ? '#fce7f3' : '#e0f2fe'} />
          {isFemale ? (
            <>
              <path d="M11 64c1-12 7-19 17-21h8c10 2 16 9 17 21" fill="#a78bfa" />
              <path d="M18 31c-3-13 1-23 10-26 11-4 21 4 20 18l-2 18-9 9H24l-7-11z" fill="#513b35" />
              <ellipse cx="32" cy="28" rx="12" ry="15" fill="#f2c5a5" />
              <path d="M20 24c1-11 7-16 14-16 8 0 12 6 13 14-4-1-7-4-9-8-4 5-10 8-18 10" fill="#513b35" />
              <path d="M25 28h2m10 0h2" stroke="#47312d" strokeLinecap="round" strokeWidth="1.8" />
              <path d="M29 36c2 2 4 2 6 0" fill="none" stroke="#b25d62" strokeLinecap="round" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <path d="M10 64c2-12 9-19 18-21h8c10 2 16 9 18 21" fill="#0f766e" />
              <path d="M20 26c-2-11 3-19 12-19 10 0 14 8 12 19l-3 12H23z" fill="#3c302d" />
              <ellipse cx="32" cy="29" rx="12" ry="15" fill="#e9b994" />
              <path d="M20 24c1-10 6-15 13-15 7 0 11 4 12 12-4-1-7-4-9-7-4 4-9 7-16 8" fill="#3c302d" />
              <path d="M25 29h2m10 0h2" stroke="#3c302d" strokeLinecap="round" strokeWidth="1.8" />
              <path d="M29 36c2 1.5 4 1.5 6 0" fill="none" stroke="#a45c51" strokeLinecap="round" strokeWidth="1.5" />
            </>
          )}
        </svg>
      )}
    </div>
  );
};
