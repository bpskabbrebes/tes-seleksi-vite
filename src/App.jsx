import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, runTransaction } from 'firebase/firestore';
import { User, ClipboardList, Clock, Shuffle, LogOut, Play, ChevronLeft, ChevronRight, CheckCircle, FileText, AlertTriangle, Info, XCircle, Check, Loader2, Award, TrendingUp, CreditCard } from 'lucide-react'; // Menambahkan CreditCard

// KONFIGURASI FIREBASE (Gunakan variabel global jika tersedia)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "YOUR_API_KEY", // Ganti dengan config Anda jika __firebase_config tidak tersedia
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'bps-test-app-default';

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA PERTANYAAN (DASAR) ---
const TOTAL_QUESTIONS = 30;
const TEST_DURATION_MINUTES = 60;

const mockQuestions = [
  {
    id: 'q1',
    text: 'Seorang peternak sapi perah setiap harinya menjual 20 liter susu dengan harga Rp 5.000/liter. Maka total pendapatan yang peternak tsb dapatkan selama seminggu adalah...',
    options: ['Rp. 100.000', 'Rp. 250.000', 'Rp. 300.000', 'Rp. 350.000', 'Rp. 700.000'],
    correctAnswerIndex: 4, // E
  },
  {
    id: 'q2',
    text: '2 pangkat 6 = ...',
    options: ['64', '48', '32', '24', '16'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q3',
    text: 'Pak RT mendapat sumbangan 6 karung beras. Tiap karung beratnya 80 kg. Beras dibagikan kepada 20 orang warga. Tiap warga memperoleh beras sebanyak',
    options: ['40 kg', '36 kg', '24 kg', '20 kg', '16 kg'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q4',
    text: 'Untuk menyelesaikan sebuah apartemen, membutuhkan waktu 90 hari jika menggunakan 15 pekerja. Berapa waktu yang dibutuhkan jika pekerjanya ditambah menjadi 45 orang?',
    options: ['20 hari', '30 hari', '40 hari', '50 hari', '60 hari'],
    correctAnswerIndex: 1, // B
  },
  {
    id: 'q5',
    text: 'Dewa memiliki tabungan sebesar Rp5.500.000. Ia ingin mengambil tabungan tersebut untuk membeli chromebook seharga Rp3.500.000. Saat membeli, Dewa mendapat diskon 5%. Dewa juga menggunakan tabungannya untuk membeli sepeda seharga Rp1.000.000. Sisa berapa tabungan yang dimiliki Dewa?',
    options: ['Rp 1.325.000,-', 'Rp 1.300.000,-', 'Rp 1.175.000,-', 'Rp 1.125.000,-', 'Rp 1.025.000,-'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q6',
    text: 'Hasil perhitungan dari 110 (17) – 55 (110) + 110 (24) adalah ….',
    options: ['2310', '- 2310', '1540', '- 1540', '1450'],
    correctAnswerIndex: 3, // D
  },
  {
    id: 'q7',
    text: 'Sebuah pesawat terbang berangkat dari kota Aceh menuju kota Surabaya pukul 7 pagi dan perjalanan ke Surabaya selama 4 jam. Transit di Jakarta selama 30 menit. Pada pukul berapa pesawat tersebut tiba di Surabaya?',
    options: ['09.30', '10.30', '11.00', '11.30', '12.30'],
    correctAnswerIndex: 3, // D
  },
  {
    id: 'q8',
    text: 'Dita membeli boneka seharga Rp. 50.000. Kemudian, boneka dijual lagi dengan harga Rp. 65.000. Berapa persen keuntungan Dita?',
    options: ['30%', '40%', '50%', '60%', '70%'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q9',
    text: 'Perbandingan uang Adi dan uang Ida adalah 4 : 3. Jika uang Adi dan Ida berjumlah Rp. 280.000, berapa masing-masing uang Adi dan Ida?',
    options: ['Rp 125.000,- dan Rp 165.000,-', 'Rp 125.000,- dan Rp 160.000,-', 'Rp 120.000,- dan Rp 160.000,-', 'Rp 160.000,- dan Rp 120.000,-', 'Rp 160.000,- dan Rp 160.000,-'],
    correctAnswerIndex: 3, // D
  },
  {
    id: 'q10',
    text: 'Seseorang berjalan ke depan sejauh 11 meter, kemudian ia mundur sejauh 9 meter. Berapa jarak orang tersebut dari titik semula?',
    options: ['2', '7', '10', '11', '12'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q11',
    text: 'Jika 2x + 5 = 9, maka nilai x adalah?',
    options: ['2', '4', '6', '8', '10'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q12',
    text: 'Satu adalah berapa persen dari 175?',
    options: ['0,57', '0,75', '0,80', '80', '85'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q13',
    text: 'Nilai 17,5 merupakan 35% dari bilangan...',
    options: ['20', '30', '50', '100', '245'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q14',
    text: 'Berapakah 40% dari 10/6?',
    options: ['2/6', '2/7', '3/6', '4/7', '2/3'],
    correctAnswerIndex: 4, // E
  },
  {
    id: 'q15',
    text: 'Nilai kuadrat dari 0,7+0,5 adalah...',
    options: ['0,89', '1,00', '1,21', '1,44', '14,4'],
    correctAnswerIndex: 3, // D
  },
  {
    id: 'q16',
    text: '12,5% dari 2048 adalah...',
    options: ['2 pangkat 4', '2 pangkat 6', '2 pangkat 8', '2 pangkat 10', '2 pangkat 12'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q17',
    text: '25 adalah berapa persen dari 150?',
    options: ['0,0167', '0,167', '1,67', '16,7', '167'],
    correctAnswerIndex: 3, // D
  },
  {
    id: 'q18',
    text: 'Semua siswa pandai berhitung dan sopan. Rudi tidak sopan, tetapi pandai berhitung. Kesimpulan ...',
    options: ['Rudi adalah bukan seorang murid yang sopan.', 'Rudi adalah seorang murid yang tidak sopan.', 'Rudi adalah bukan seorang murid walaupun pandai berhitung.', 'Rudi adalah seorang murid yang pandai berhitung dan tidak sopan.', 'Rudi adalah seorang murid yang pandai berhitung'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q19',
    text: 'AIR : ES', 
    options: ['Didih', 'Uap', 'Cair', 'Sublim', 'Beku'], 
    correctAnswerIndex: 4, // E
  },
  {
    id: 'q20',
    text: 'BUMI: MATAHARI = MATAHARI : ...',
    options: ['Galaksi Bima Sakti', 'Planet', 'Bintang', 'Jupiter', 'Bulan'],
    correctAnswerIndex: 0, // A 
  },
  {
    id: 'q21',
    text: 'BEBATUAN terhadap GEOLOGI seperti GEMPA BUMI terhadap ...',
    options: ['Ilmu pengetahuan', 'Seismologi', 'Paleontologi', 'Geodesi', 'Geografi'],
    correctAnswerIndex: 1, // B
  },
  {
    id: 'q22',
    text: 'HIDUNG terhadap WAJAH seperti GULING terhadap ...',
    options: ['Kamar tidur', 'Meja', 'Kursi', 'Selimut', 'Ranjang'],
    correctAnswerIndex: 4, // E
  },
  {
    id: 'q23',
    text: 'Januari : Desember = April : ........',
    options: ['Bulan', 'September', 'Juni', 'Mei', 'Maret'],
    correctAnswerIndex: 4, // E 
  },
  {
    id: 'q24',
    text: 'EMOSIONAL : ..... = IQ : .....',
    options: ['Pandai : Cerdas', 'Kecerdasan : EQ', 'Anak : Orang dewasa', 'Ayah : Ibu', 'Murid : Guru'],
    correctAnswerIndex: 1, // B 
  },
  {
    id: 'q25',
    text: 'ES : ........ = ........ : MENYUBLIM',
    options: ['Mencair : Kamper', 'Dingin : Panas', 'Batu : Uap', 'Laut : Memuai', 'Dingin : Hangat'],
    correctAnswerIndex: 0, // A 
  },
  {
    id: 'q26',
    text: 'Apa yang harus dilakukan pencacah jika tidak memahami pertanyaan dalam kuesioner?',
    options: ['Mengabaikan pertanyaan tersebut', 'Mengarang jawaban', 'Bertanya kepada supervisor', 'Mengubah pertanyaan', 'Mengisi jawaban sesuka hati'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q27',
    text: 'Apa yang dimaksud konflik kepentingan dalam kode etik pencacah?',
    options: ['Situasi dimana pencacah memiliki kepentingan pribadi yang dapat mempengaruhi pekerjaannya', 'Situasi dimana pencacah tidak memiliki kepentingan pribadi', 'Situasi dimana pencacah tidak bekerja sesuai prosedur', 'Situasi dimana pencacah bekerja sesuai prosedur', 'Situasi dimana pencacah tidak memiliki tugas'],
    correctAnswerIndex: 0, // A
  },
  {
    id: 'q28',
    text: 'Apa yang dimaksud dengan profesionalisme dalam kode etik pencacah?',
    options: ['Bersikap acuh tak acuh', 'Bersikap sopan', 'Menjaga sikap dan perilaku yang sesuai dengan standar profesi', 'Mengabaikan prosedur survei', 'Meminta hadiah dari responden'],
    correctAnswerIndex: 2, // C
  },
  {
    id: 'q29',
    text: 'Apa yang dimaksud dengan akurasi dalam kode etik pencacah?',
    options: ['Mengubah data sesuai keinginan', 'Mengumpulkan data yang benar dan tepat', 'Mengabaikan prosedur survei', 'Meminta hadiah dari responden', 'Bersikap sopan kepada responden'],
    correctAnswerIndex: 1, // B
  },
  {
    id: 'q30',
    text: 'Apa yang dimaksud transparansi dalam kode etik pencacah?',
    options: ['Menyembunyikan informasi dari supervisor', 'Menyampaikan informasi secara jelas dan terbuka', 'Mengubah data sesuai keinginan', 'Mengabaikan prosedur survei', 'Bersikap sopan kepada responden'],
    correctAnswerIndex: 1, // B
  },
];

// Fungsi utilitas untuk mengacak array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const newArray = [...array]; 
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; 
  }
  return newArray;
};


// --- KOMPONEN UTAMA APP ---
function App() {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [testData, setTestData] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [testScore, setTestScore] = useState(null); 
  const [testStatus, setTestStatus] = useState('Belum Dikerjakan'); 

  // Deklarasi Callback
  const getTestDocRef = useCallback((idSobat) => {
    if (!idSobat) return null;
    return doc(db, "artifacts", appId, "public/data/bps_test_results", idSobat);
  }, []); 

  const handleFinishTest = useCallback(async () => {
    if (isLoading || currentPage === 'results' || !currentUser || !testData) return;
    
    setIsLoading(true);
    let score = 0;
    testData.questions.forEach(q => {
      const userAnswerIndex = testData.answers.get(q.id);
      if (userAnswerIndex !== undefined && userAnswerIndex === q.correctAnswerIndex) {
        score++;
      }
    });
    const finalScore = testData.questions.length > 0 ? Math.round((score / testData.questions.length) * 100) : 0;
    setTestScore(finalScore); 

    const testEndTime = new Date(); 

    try {
      const testDocRef = getTestDocRef(currentUser.idSobat); 
      await setDoc(testDocRef, {
        status: 'Selesai',
        score: finalScore, 
        endTime: serverTimestamp(), 
        endTimeISO: testEndTime.toISOString(), 
        startTimeISO: testData.startTime ? new Date(testData.startTime).toISOString() : null, 
        finalAnswers: Array.from(testData.answers.entries()).map(([qid, ansIdx]) => ({questionId: qid, answerIndex: ansIdx })),
      }, { merge: true });
      
      setTestStatus('Selesai');
      
      const appsScriptSheetUrl = 'https://script.google.com/macros/s/AKfycbwXW17QWg97dR1T5tmhbQ4OuIjluK9ertwI5iaMIA2b0rOr4eNoqX9fJ1SjKVjVcPUN/exec'; 
      
      if (appsScriptSheetUrl !== 'URL_APPS_SCRIPT_UNTUK_MENULIS_HASIL_TES_ANDA' && appsScriptSheetUrl !== '') {
        try {
          const sheetData = {
            idSobat: currentUser.idSobat,
            namaLengkap: currentUser.namaLengkap,
            skor: finalScore,
            waktuMulai: testData.startTime ? new Date(testData.startTime).toISOString() : 'N/A',
            waktuSelesai: testEndTime.toISOString(),
          };

          await fetch(appsScriptSheetUrl, { 
            method: 'POST',
            mode: 'no-cors', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
          });
          
          console.log('Data hasil tes dikirim ke Google Sheet (diasumsikan sukses dengan no-cors).');

        } catch (sheetError) {
          console.error('Error mengirim data hasil tes ke Google Sheet:', sheetError);
        }
      } else {
        console.warn('URL Apps Script untuk hasil tes belum dikonfigurasi. Melewatkan pengiriman data ke Sheet.');
      }

      setCurrentPage('results'); 
    } catch (e) {
      console.error("Error finishing test: ", e);
      setError("Gagal menyimpan hasil tes: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, testData, getTestDocRef, isLoading, currentPage]);


  // Efek untuk otentikasi Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        if (!currentUser) setIsLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Error signing in anonymously: ", e);
          setError("Gagal menginisialisasi sesi. Silakan coba lagi.");
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser]);


  // Efek untuk timer ujian
  useEffect(() => {
    let timerId;
    if (currentPage === 'test' && timeLeft > 0 && testData?.startTime) {
      timerId = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            handleFinishTest(); 
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [currentPage, timeLeft, testData?.startTime, handleFinishTest]);

  // Fungsi untuk menangani login
  const handleLogin = async (idSobat, namaLengkap) => {
    if (!idSobat.trim() || !namaLengkap.trim()) {
      setError("ID Sobat BPS dan Nama Lengkap tidak boleh kosong.");
      return;
    }
    if (!firebaseUser) {
      setError("Sesi otentikasi belum siap. Silakan tunggu sebentar.");
      return;
    }
    setIsLoading(true);
    setError('');
    setInfo('');

    const validationAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbzIWyhCcLfXHKcV6MbEDpYUC0IP77PIj7mRRtsUnZMFk4oweuyygaPN_NEagpGMdEY/exec'; // GANTI DENGAN URL ANDA

    if (validationAppsScriptUrl === 'URL_APPS_SCRIPT_VALIDASI_ID_SOBAT_ANDA' || validationAppsScriptUrl === '') {
        setError("Fitur validasi ID Sobat belum dikonfigurasi. Silakan hubungi admin.");
        console.error("URL Apps Script untuk validasi ID Sobat belum diatur di kode React (variabel validationAppsScriptUrl).");
        setIsLoading(false);
        return;
    }

    try {
      const validationUrl = `${validationAppsScriptUrl}?idSobat=${encodeURIComponent(idSobat.trim())}&namaLengkap=${encodeURIComponent(namaLengkap.trim())}`;
      const response = await fetch(validationUrl);
      
      if (!response.ok) {
          const errorText = await response.text();
          console.error("Apps Script validation error response:", errorText);
          throw new Error(`Validasi ke Apps Script gagal: ${response.status} - ${errorText}`);
      }

      const validationResult = await response.json();

      if (!validationResult.isValid) {
        setError(validationResult.error || "ID Sobat atau Nama Lengkap tidak valid.");
        setIsLoading(false);
        return;
      }
      
      const validatedNamaLengkap = validationResult.registeredName || namaLengkap;
      const userToSet = { idSobat, namaLengkap: validatedNamaLengkap, firebaseUid: firebaseUser.uid };
      
      const testDocRef = getTestDocRef(idSobat);
      const docSnap = await getDoc(testDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTestStatus(data.status || 'Belum Dikerjakan');
        if (data.status === 'Selesai') {
          setError("Anda sudah menyelesaikan tes ini dan tidak dapat mengerjakan ulang.");
          setTestScore(data.score); 
          setCurrentUser(userToSet); 
          setCurrentPage('results'); 
          setIsLoading(false);
          return;
        }
       
        if (data.status === 'Sedang Dikerjakan') {
           setInfo("Status tes Anda sebelumnya 'Sedang Dikerjakan'. Anda dapat melanjutkan ke dashboard dan memulai tes lagi jika diinginkan (progres sebelumnya akan direset).");
        }
      } else {
        await setDoc(testDocRef, {
          namaLengkap: validatedNamaLengkap, 
          idSobat,
          status: 'Belum Dikerjakan',
          firebaseUid: firebaseUser.uid, 
          createdAt: serverTimestamp(),
        });
        setTestStatus('Belum Dikerjakan');
      }
      
      setCurrentUser(userToSet);
      setCurrentPage('dashboard');

    } catch (e) {
      console.error("Error during login/validation: ", e);
      setError("Terjadi kesalahan saat validasi atau login: " + (e.message || "Error tidak diketahui"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memulai tes
  const handleStartTest = async () => {
    if (!currentUser || !currentUser.idSobat) {
      setError("Informasi pengguna tidak ditemukan untuk memulai tes.");
      return;
    }
    // Tambahan: Cek status tes sebelum memulai
    if (testStatus === 'Selesai') {
        setError("Anda sudah menyelesaikan tes ini dan tidak dapat mengerjakannya lagi.");
        setCurrentPage('results'); // Arahkan ke halaman hasil jika sudah selesai
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      const questionsToProcess = mockQuestions.map(q => ({
        ...q,
        options: [...q.options] 
      }));

      const shuffledQuestionOrder = shuffleArray(questionsToProcess);

      const finalProcessedQuestions = shuffledQuestionOrder.map(question => {
        const originalCorrectOptionText = question.options[question.correctAnswerIndex];
        const shuffledOptionsArray = shuffleArray(question.options); 
        const newCorrectAnswerIndex = shuffledOptionsArray.findIndex(option => option === originalCorrectOptionText);
        
        return {
          ...question,
          options: shuffledOptionsArray,
          correctAnswerIndex: newCorrectAnswerIndex,
        };
      });
      
      const testDocRef = getTestDocRef(currentUser.idSobat);
      const initialAnswers = new Map(); 

      await setDoc(testDocRef, {
        status: 'Sedang Dikerjakan',
        startTime: serverTimestamp(), 
        answers: [], 
        score: null, 
        lastQuestionIndex: 0,
      }, { merge: true });

      setTestData({
        questions: finalProcessedQuestions, 
        answers: initialAnswers,
        currentQuestionIndex: 0,
        startTime: Date.now(), 
      });
      setTimeLeft(TEST_DURATION_MINUTES * 60);
      setTestStatus('Sedang Dikerjakan');
      setCurrentPage('test');

    } catch (e) {
      console.error("Error starting test: ", e);
      setError("Gagal memulai tes: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menyimpan jawaban
  const handleAnswer = (questionId, answerIndex) => {
    setTestData(prevData => {
      const newAnswers = new Map(prevData.answers);
      newAnswers.set(questionId, answerIndex);
      return { ...prevData, answers: newAnswers };
    });
  };
  
  // Fungsi untuk navigasi soal
  const navigateQuestion = (index) => {
    if (testData && index >= 0 && index < testData.questions.length) {
      setTestData(prevData => ({ ...prevData, currentQuestionIndex: index }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTestData(null);
    setError('');
    setInfo('');
    setTestScore(null);
    setTestStatus('Belum Dikerjakan');
    setCurrentPage('login');
  };

  // Render berdasarkan halaman saat ini
  if (isLoading && !error && !currentUser && currentPage === 'login') { 
    return <FullScreenLoader message="Memuat perubahan..." />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={error} info={info} />;
      case 'dashboard':
        return <DashboardPage user={currentUser} onStartTest={handleStartTest} onLogout={handleLogout} testStatus={testStatus} isLoading={isLoading} error={error} info={info} />;
      case 'test':
        return <TestPage
          testData={testData}
          onAnswer={handleAnswer}
          onNavigate={navigateQuestion} 
          onFinishTest={handleFinishTest}
          timeLeft={timeLeft}
          currentUser={currentUser}
          isLoading={isLoading}
        />;
      case 'results':
        return <ResultsPage user={currentUser} score={testScore} onLogout={handleLogout} error={error} />;
      default:
        return <LoginPage onLogin={handleLogin} isLoading={isLoading} error={error} info={info} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-['Inter',_sans-serif] flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-blue-500 selection:text-white">
      {renderPage()}
    </div>
  );
}

// --- KOMPONEN HALAMAN ---

const FullScreenLoader = ({ message = "Memuat perubahan..." }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-600 animate-spin mb-4" />
    <p className="text-lg md:text-xl text-slate-700 font-medium">{message}</p>
  </div>
);

function LoginPage({ onLogin, isLoading, error, info }) {
  const [idSobat, setIdSobat] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  
  const initialLogoUrl = "https://i.imgur.com/DWUT5yJ.png"; 
  const fallbackLogoUrl = "https://placehold.co/200x80/3B82F6/FFFFFF?text=Logo+BPS";
  
  const [currentLogoSrc, setCurrentLogoSrc] = useState(initialLogoUrl);
  const [showIconFallback, setShowIconFallback] = useState(false);


  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(idSobat, namaLengkap);
  };

  const handleLogoError = useCallback(() => {
    console.error(`LOGO ERROR: Gagal memuat logo dari src="${currentLogoSrc}".`);
    if (currentLogoSrc === initialLogoUrl) {
      console.log("Mencoba fallback placeholder URL.");
      setCurrentLogoSrc(fallbackLogoUrl);
    } else if (currentLogoSrc === fallbackLogoUrl) {
      console.error("LOGO FALLBACK ERROR: Gagal memuat logo placeholder. Menampilkan ikon ClipboardList.");
      setShowIconFallback(true);
    }
  }, [currentLogoSrc, initialLogoUrl, fallbackLogoUrl]);


  return (
    <div className="w-full max-w-5xl bg-white shadow-2xl rounded-xl p-4 sm:p-6 md:p-10 transform transition-all duration-500 hover:scale-[1.01]">
      <header className="text-center mb-8 md:mb-10">
        {!showIconFallback ? (
          <img 
            key={currentLogoSrc} 
            src={currentLogoSrc} 
            alt="Logo BPS" 
            className="mx-auto mb-1 md:mb-1 h-24 md:h-28 w-auto" 
            onError={handleLogoError} 
          />
        ) : (
          <div className="inline-block p-2 md:p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white mb-1 md:mb-1.5 shadow-lg"> 
            <ClipboardList size={48} md:size={56} /> 
          </div>
        )}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">BPS Kabupaten Brebes</h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-800 mt-3 md:mt-4">Tes Seleksi Kompetensi Mitra 2025</h2>
        <p className="text-xs sm:text-sm text-slate-500 md:text-base">Sistem Ujian Online Terintegrasi</p>
      </header>

      {error && <Message type="error" message={error} />}
      {info && <Message type="info" message={info} />}

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="md:w-3/5 bg-slate-50 p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200/80">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-700 mb-1 sm:mb-2">Masuk Tes Seleksi</h3>
          <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-500 mb-4 sm:mb-6">Gunakan ID Sobat BPS dan nama lengkap Anda untuk mengikuti tes.</p>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="idSobat" className="block text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1 sm:mb-1.5">ID Sobat BPS</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                  <CreditCard size={16} sm:size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  id="idSobat"
                  value={idSobat}
                  onChange={(e) => setIdSobat(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base transition-colors duration-150"
                  placeholder="Masukkan ID Sobat BPS"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs md:text-sm text-slate-500">ID Sobat BPS adalah nomor identitas unik.</p>
            </div>
            <div>
              <label htmlFor="namaLengkap" className="block text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1 sm:mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                  <User size={16} sm:size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  id="namaLengkap"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base transition-colors duration-150"
                  placeholder="Masukkan nama lengkap sesuai KTP"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center transform active:scale-95 text-sm sm:text-base md:text-lg"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" size={18} sm:size={20} /> : null}
              Masuk
            </button>
          </form>
          <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-md text-yellow-800 shadow-sm">
            <h4 className="font-semibold flex items-center text-xs sm:text-sm"> 
              <AlertTriangle size={16} className="mr-2 text-yellow-500" />Perhatian Penting:
            </h4>
            <ul className="list-disc list-inside text-[9px] sm:text-[10px] space-y-1 mt-1.5 pl-1">
              <li>Setiap peserta hanya dapat mengerjakan tes SATU KALI.</li>
              <li>Setelah selesai atau waktu habis, Anda akan otomatis keluar.</li>
              <li>Tidak dapat masuk kembali setelah menyelesaikan tes.</li>
              <li>Pastikan data yang dimasukkan benar dan koneksi internet stabil.</li>
            </ul>
          </div>
        </div>

        <div className="md:w-2/5 space-y-4 sm:space-y-6">
          <div className="bg-sky-50 p-3 sm:p-4 rounded-lg shadow-lg border border-sky-200/70">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-sky-800 mb-2 sm:mb-3 flex items-center"><Info size={18} sm:size={20} className="mr-2 text-sky-600" />Informasi Tes</h3>
            <div className="space-y-2 sm:space-y-2.5 text-slate-700">
              <div className="flex items-center text-[10px] sm:text-[11px] md:text-xs">
                <FileText size={14} sm:size={16} className="mr-2 sm:mr-2.5 text-sky-500 flex-shrink-0" /> 
                <div><strong>Jumlah Soal:</strong> {TOTAL_QUESTIONS} soal pilihan ganda</div>
              </div>
              <div className="flex items-center text-[10px] sm:text-[11px] md:text-xs">
                <Clock size={14} sm:size={16} className="mr-2 sm:mr-2.5 text-sky-500 flex-shrink-0" /> 
                <div><strong>Durasi:</strong> {TEST_DURATION_MINUTES} menit</div>
              </div>
              <div className="flex items-center text-[10px] sm:text-[11px] md:text-xs">
                <Shuffle size={14} sm:size={16} className="mr-2 sm:mr-2.5 text-sky-500 flex-shrink-0" /> 
                <div><strong>Soal</strong>: acak</div>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg shadow-lg border border-emerald-200/70">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-emerald-800 mb-2 sm:mb-3 flex items-center"><CheckCircle size={18} sm:size={20} className="mr-2 text-emerald-600" />Petunjuk Penting</h3>
            <ul className="list-disc list-inside text-[10px] sm:text-[11px] md:text-xs text-slate-700 space-y-1 sm:space-y-1.5 pl-1">
              <li>Pastikan koneksi internet stabil selama tes.</li>
              <li>Tes akan otomatis tersimpan jika waktu habis.</li>
              <li>Kerjakan soal yang mudah dahulu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user, onStartTest, onLogout, testStatus, isLoading, error, info }) {
  const getAvatarText = (name) => {
    if (!name) return 'WW'; 
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-4 sm:p-6 md:p-8 transform transition-all duration-500 hover:scale-[1.01]">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-slate-200">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mr-3 sm:mr-4 shadow-md">
            {getAvatarText(user?.namaLengkap)}
          </div>
          <div>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base">Selamat datang,</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-800">{user?.namaLengkap || 'Peserta'}</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-500">ID Sobat: {user?.idSobat || 'Tidak diketahui'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg text-xs sm:text-sm md:text-base flex items-center transition-all duration-150 shadow hover:shadow-md active:scale-95"
        >
          <LogOut size={14} sm:size={16} className="mr-1.5 sm:mr-2" /> Keluar
        </button>
      </header>

      {error && <Message type="error" message={error} />}
      {info && <Message type="info" message={info} />}

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="md:w-3/5 bg-slate-50 p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200/80">
          <div className="flex items-center text-blue-700 mb-1.5 sm:mb-2">
            <ClipboardList size={20} sm:size={22} className="mr-2 sm:mr-2.5"/>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold">Tes Seleksi Kompetensi Mitra BPS</h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 mb-4 sm:mb-6">Kabupaten Brebes 2025</p>
          
          <div className="flex space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="bg-blue-100 text-blue-700 p-3 sm:p-4 rounded-lg flex-1 text-center shadow-md border border-blue-200/70">
              <FileText size={24} sm:size={28} className="mx-auto mb-1 sm:mb-1.5 text-blue-500" />
              <p className="font-semibold text-base sm:text-lg md:text-xl">{TOTAL_QUESTIONS}</p>
              <p className="text-[10px] sm:text-xs md:text-sm">Soal</p>
            </div>
            <div className="bg-emerald-100 text-emerald-700 p-3 sm:p-4 rounded-lg flex-1 text-center shadow-md border border-emerald-200/70">
              <Clock size={24} sm:size={28} className="mx-auto mb-1 sm:mb-1.5 text-emerald-500" />
              <p className="font-semibold text-base sm:text-lg md:text-xl">{TEST_DURATION_MINUTES}</p>
              <p className="text-[10px] sm:text-xs md:text-sm">Menit</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 rounded-md text-red-800 shadow-sm">
            <h4 className="font-semibold flex items-center text-[10px] sm:text-xs md:text-xs">
              <AlertTriangle size={16} sm:size={18} className="mr-2 text-red-500" />PERINGATAN PENTING!
            </h4>
            <ul className="list-disc list-inside text-[9px] sm:text-[10px] md:text-xs space-y-1 sm:space-y-1.5 mt-1.5 sm:mt-2 pl-1">
              <li>Tes hanya dapat dikerjakan SATU KALI.</li>
              <li>Setelah selesai akan otomatis logout.</li>
              <li>Tidak dapat masuk kembali setelah tes selesai.</li>
              <li>Urutan soal dan pilihan jawaban diacak.</li>
            </ul>
          </div>
        </div>

        <div className="md:w-2/5 bg-white p-4 sm:p-6 rounded-lg shadow-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-1.5 sm:mb-2">Persiapan Tes</h2> {/* Diubah */}
            <p className="text-[10px] sm:text-[11px] text-slate-500 mb-6 sm:mb-8">Pastikan Anda siap untuk mengerjakan tes.</p>
            
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base mb-6 sm:mb-8">
              <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-100 rounded-md">
                <span className="text-slate-600 font-medium">Status:</span>
                <span className={`font-semibold px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs md:text-sm shadow-sm ${
                  testStatus === 'Selesai' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 
                  testStatus === 'Sedang Dikerjakan' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                  'bg-slate-200 text-slate-700 border border-slate-300'}`
                }>{testStatus}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-100 rounded-md">
                <span className="text-slate-600 font-medium">ID Sobat:</span>
                <span className="font-semibold text-slate-700">{user?.idSobat}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-100 rounded-md">
                <span className="text-slate-600 font-medium">Peserta:</span>
                <span className="font-semibold text-slate-700">{user?.namaLengkap}</span>
              </div>
            </div>
          </div>

          {testStatus !== 'Selesai' ? (
            <div className="mt-auto">
              <button
                onClick={onStartTest}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center text-sm sm:text-base md:text-lg transform active:scale-95" /* Ukuran font tombol diperkecil */
              >
                {isLoading ? <Loader2 className="animate-spin mr-2 sm:mr-2.5" size={18} sm:size={20} /> : <Play size={16} sm:size={20} className="mr-1.5 sm:mr-2" />} {/* Ukuran ikon disesuaikan */}
                Mulai Tes Sekarang
              </button>
              <p className="text-[9px] sm:text-[10px] text-yellow-700 mt-3 sm:mt-3.5 text-center flex items-center justify-center"> 
                <AlertTriangle size={14} sm:size={16} className="mr-1 sm:mr-1.5 text-yellow-500" /> 
                 Setelah mulai, timer akan berjalan dan tidak dapat dihentikan!
              </p>
            </div>
          ) : (
            <p className="text-center text-emerald-600 font-semibold p-3 sm:p-4 bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm text-sm sm:text-base md:text-lg">Anda telah menyelesaikan tes ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TestPage({ testData, onAnswer, onNavigate, onFinishTest, timeLeft, currentUser, isLoading }) {
  if (!testData || !testData.questions || testData.questions.length === 0) {
     return <FullScreenLoader message="Memuat data tes..." />;
  }

  const { questions, answers, currentQuestionIndex } = testData;
  const safeCurrentQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, questions.length - 1));
  const currentQuestion = questions[safeCurrentQuestionIndex];
  
  if (!currentQuestion) { 
    return <FullScreenLoader message="Memuat pertanyaan..." />;
  }

  const answeredCount = answers.size;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercentage = questions.length > 0 ? ((safeCurrentQuestionIndex + 1) / questions.length) * 100 : 0;
  
  return (
    <div className="w-full max-w-7xl bg-white shadow-2xl rounded-xl p-2 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-[calc(100vh-40px)] sm:min-h-[calc(100vh-80px)]">
      <div className="flex-grow lg:w-[calc(100%-280px)] xl:w-[calc(100%-320px)] bg-slate-50 p-3 sm:p-5 md:p-8 rounded-lg shadow-lg border border-slate-200/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 pb-2 sm:pb-3 border-b border-slate-300">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">Soal {safeCurrentQuestionIndex + 1}</h2>
            <p className={`text-[10px] sm:text-xs md:text-sm font-medium mt-0.5 px-1.5 sm:px-2 py-0.5 inline-block rounded-full ${answers.has(currentQuestion.id) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
              {answers.has(currentQuestion.id) ? 'Sudah Dijawab' : 'Belum Dijawab'}
            </p>
          </div>
          <div className="text-right mt-2 sm:mt-0 bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md">
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{formatTime(timeLeft)}</p>
            <p className="text-[10px] sm:text-xs md:text-sm opacity-80">Sisa Waktu</p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-[10px] sm:text-xs md:text-sm text-slate-500 mb-1 sm:mb-1.5">
                <span>Soal {safeCurrentQuestionIndex + 1} dari {questions.length}</span>
                <span>Terjawab: {answeredCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-sky-500 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>

        <div className="mb-6 sm:mb-8 min-h-[80px] sm:min-h-[100px]">
          <p className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed">{currentQuestion.text}</p>
        </div>

        <div className="space-y-2.5 sm:space-y-3.5">
          {currentQuestion.options.map((option, index) => (
            <label
              key={index}
              className={`block w-full p-2.5 sm:p-3 md:p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md
                ${answers.get(currentQuestion.id) === index 
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg ring-2 ring-blue-300 ring-offset-1' 
                  : 'bg-white border-slate-300 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'}`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={index}
                checked={answers.get(currentQuestion.id) === index}
                onChange={() => onAnswer(currentQuestion.id, index)}
                className="sr-only" 
              />
              <span className="font-medium text-[10px] sm:text-xs md:text-sm">{String.fromCharCode(65 + index)}.</span> <span className="text-[10px] sm:text-xs md:text-sm">{option}</span>
            </label>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 flex justify-between items-center">
          <button
            onClick={() => onNavigate(safeCurrentQuestionIndex - 1)} 
            disabled={safeCurrentQuestionIndex === 0 || isLoading}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 sm:py-2.5 px-3 sm:px-5 rounded-lg flex items-center transition-all duration-150 shadow hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 text-xs sm:text-sm md:text-base"
          >
            <ChevronLeft size={18} sm:size={20} className="mr-1 sm:mr-1.5" /> Sebelumnya
          </button>
          <button
            onClick={() => onNavigate(safeCurrentQuestionIndex + 1)} 
            disabled={safeCurrentQuestionIndex === questions.length - 1 || isLoading}
            className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-5 rounded-lg flex items-center transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 text-xs sm:text-sm md:text-base"
          >
            Selanjutnya <ChevronRight size={18} sm:size={20} className="ml-1 sm:ml-1.5" />
          </button>
        </div>
      </div>

      <div className="lg:w-[260px] xl:w-[300px] bg-slate-100 p-3 sm:p-5 md:p-6 rounded-lg shadow-lg border border-slate-200/80 flex-shrink-0">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-700 mb-3 sm:mb-5">Navigasi Soal</h3>
        <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 sm:gap-2.5 mb-4 sm:mb-6">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => onNavigate(index)}
              disabled={isLoading}
              className={`w-full aspect-square rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm font-medium flex items-center justify-center transition-all duration-150 border-2
                ${index === safeCurrentQuestionIndex 
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xl scale-105' 
                  : answers.has(q.id) 
                    ? 'bg-green-400 hover:bg-green-500 text-white border-green-500 shadow-md' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300 hover:border-slate-400 shadow'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="text-[10px] sm:text-xs md:text-sm text-slate-600 space-y-1 sm:space-y-1.5 mb-4 sm:mb-6">
            <p className="flex items-center"><span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-600 rounded-sm mr-1.5 sm:mr-2 border border-blue-700"></span> Soal saat ini</p>
            <p className="flex items-center"><span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-400 rounded-sm mr-1.5 sm:mr-2 border border-green-500"></span> Sudah dijawab</p>
            <p className="flex items-center"><span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-slate-200 rounded-sm mr-1.5 sm:mr-2 border border-slate-300"></span> Belum dijawab</p>
        </div>
        <button
          onClick={onFinishTest}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-2.5 sm:py-3 md:py-3.5 px-4 rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-150 active:scale-95 text-sm sm:text-base md:text-lg"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2 sm:mr-2.5" size={20} sm:size={22}/> : <CheckCircle size={20} sm:size={22} className="mr-1.5 sm:mr-2" />}
          Selesai Tes
        </button>
      </div>
    </div>
  );
}

function ResultsPage({ user, score, onLogout, error }) {
  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 text-center transform transition-all duration-500 hover:scale-[1.01]">
      <header className="mb-6 sm:mb-8">
        <CheckCircle size={60} sm:size={72} className="text-green-500 mx-auto mb-4 sm:mb-5" /> 
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Tes Selesai!</h1>
        {/* Ukuran font diperkecil */}
        <p className="text-slate-600 mt-1 text-xs sm:text-sm md:text-base">Terima kasih, <span className="font-semibold">{user?.namaLengkap || 'Peserta'}</span>, telah menyelesaikan tes.</p>
      </header>

      {error && <Message type="error" message={error} />}
      
      <div className="bg-gradient-to-br from-sky-50 to-blue-100 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 shadow-lg border border-blue-200/70">
        <p className="text-xs sm:text-sm md:text-base text-slate-500">ID Sobat: {user?.idSobat}</p>
         {/* Ukuran font diperkecil */}
        <p className="text-sm sm:text-base md:text-lg text-slate-700 font-medium mt-2 sm:mt-3">
          Hasil tes Anda telah berhasil direkam.
        </p>
      </div>
      
      <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 mb-6 sm:mb-8">Anda tidak dapat mengulang tes ini. Sesi Anda akan segera berakhir.</p>

      <button
        onClick={onLogout}
        className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-150 active:scale-95 text-sm sm:text-base md:text-lg"
      >
        <LogOut size={16} sm:size={18} className="mr-2" /> Kembali ke Halaman Login
      </button>
    </div>
  );
}


// Komponen utilitas untuk pesan error/info
const Message = ({ type, message }) => {
  const baseClasses = "p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg text-xs sm:text-sm md:text-base flex items-center shadow-md border";
  const typeClasses = {
    error: "bg-red-50 text-red-700 border-red-300",
    info: "bg-sky-50 text-sky-700 border-sky-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };
  const IconComponent = type === 'error' ? XCircle : type === 'info' ? Info : Check;

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>
      <IconComponent size={20} sm:size={22} className="mr-2 sm:mr-3 flex-shrink-0" />
      <p className="flex-grow">{message}</p>
    </div>
  );
};

export default App;

