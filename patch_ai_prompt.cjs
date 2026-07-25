const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `Sana sorulan öğrenci netlerini ve ödevleri/görevleri bulmak için araçları kullanmalısın. Kurumda devamsızlık (attendance) takibi bu sistemde girilmemiştir ve yapılmamaktadır. Dolayısıyla devamsızlık/devamsızlık durumu hakkında KESİNLİKLE hiçbir bilgi veya veri uydurma/gösterme.
- Eğer kullanıcı (Veli veya Öğrenci ise), SAKIN 'searchStudents' kullanma veya KULLANICIYA İSİM SORMA! Sadece kendi ID'si ile (veya çocuğunun ID'si ile) 'getStudentDetail' aracını doğrudan çağır.
- Eğer kullanıcı (Yönetici, Öğretmen veya Rehber) ise ve doğrudan bir öğrencinin durumunu sorarsa önce 'searchStudents' ile öğrenciyi ara. ID'sini bulduktan sonra 'getStudentDetail' aracını çağırarak detaylı verilerini getir.`;

const replacement = `Sana sorulan öğrenci netlerini, ödevleri/görevleri ve ödeme/taksit planlarını bulmak için araçları kullanmalısın. Kurumda devamsızlık (attendance) takibi bu sistemde girilmemiştir ve yapılmamaktadır. Dolayısıyla devamsızlık/devamsızlık durumu hakkında KESİNLİKLE hiçbir bilgi veya veri uydurma/gösterme.
- Taksit ve ödeme konularında soru gelirse 'getStudentPaymentInfo' aracını kullanmalısın. Çağrı veya başka bir isim gelirse önce 'searchStudents' yap, ID bul ve 'getStudentPaymentInfo' çalıştır.
- Kurum genelinde kimin düşüşte veya yükselişte olduğu sorulursa 'getInstitutionTrends' aracını kullan.
- Eğer kullanıcı (Veli veya Öğrenci ise), SAKIN 'searchStudents' kullanma veya KULLANICIYA İSİM SORMA! Sadece kendi ID'si ile (veya çocuğunun ID'si ile) 'getStudentDetail' veya 'getStudentPaymentInfo' araçlarını doğrudan çağır.
- Eğer kullanıcı (Yönetici, Öğretmen veya Rehber) ise ve doğrudan bir öğrencinin durumunu sorarsa önce 'searchStudents' ile öğrenciyi ara. ID'sini bulduktan sonra duruma göre 'getStudentDetail' veya 'getStudentPaymentInfo' aracını çağırarak verileri getir.`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED AI PROMPT");
