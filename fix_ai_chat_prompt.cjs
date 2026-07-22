const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

// Replace extraVeliContext logic
const oldVeliContext = `  let extraVeliContext = "";
  if (userRole === 'veli') {
    const student = db.getOgrenciler().find(s => s.veli_id === userId);
    if (student) {
      extraVeliContext = \`\\n- Öğrenciniz (Çocuğunuz): \${student.ad_soyad} (Öğrenci ID: \${student.id})\\n\\nDİKKAT (VELİ İÇİN ZORUNLU KURAL): Sen velinin çocuğunun "\${student.ad_soyad}" olduğunu zaten biliyorsun! Kullanıcıya "Hangi öğrenci?" diye KESİNLİKLE SORMA. Veli genel bir "Öğrencinin netleri nedir?" sorusu sorduğunda, doğrudan \${student.id} ID'si ile "getStudentDetail" aracını çağır ve sonucu göster. Başka bir öğrencinin adını yazsa bile bunu reddet ve sadece "\${student.ad_soyad}" hakkında bilgi verebileceğini söyle.\`;
    }
  } else if (userRole === 'ogrenci') {
    const studentId = userId - 10000;
    extraVeliContext = \`\\n- Senin Öğrenci ID'n: \${studentId}\\n\\nDİKKAT (ÖĞRENCİ İÇİN ZORUNLU KURAL): Sen kullanıcının kim olduğunu biliyorsun! "Kimin notlarına bakmak istiyorsun?" diye SORMA. Genel bir soru sorduğunda doğrudan \${studentId} ID'sini kullanarak "getStudentDetail" çağır.\`;
  }`;

const newVeliContext = `  let extraVeliContext = "";
  if (userRole === 'veli') {
    const student = db.getOgrenciler().find(s => s.veli_id === userId);
    if (student) {
      extraVeliContext = \`\\n- Öğrenciniz (Çocuğunuz): \${student.ad_soyad} (Öğrenci ID: \${student.id})
- KULLANICI KİMLİĞİ KURALI: Sen velinin çocuğunun "\${student.ad_soyad}" olduğunu biliyorsun. Kendi çocuğunu sorduğunda "Hangi öğrenci?" diye sorma.
- ARAÇ ÇAĞIRMA ŞARTI: SADECE veli çocuğunun netlerini, sınav sonuçlarını veya ödevlerini sorduğunda 'getStudentDetail' (ID: \${student.id}) çağır.
- KESİNLİKLE ARAÇ ÇAĞIRMA: Veli "Merhaba", "Nasılsın", "Ben net sormadım" gibi sohbet veya düzeltme mesajı attığında HİÇBİR ARAÇ ÇAĞIRMA, doğrudan cevap ver.\`;
    }
  } else if (userRole === 'ogrenci') {
    const studentId = userId - 10000;
    extraVeliContext = \`\\n- Senin Öğrenci ID'n: \${studentId}
- KULLANICI KİMLİĞİ KURALI: Sen kullanıcının kim olduğunu zaten biliyorsun. "Kimin notlarına bakmak istiyorsun?" diye SORMA.
- ARAÇ ÇAĞIRMA ŞARTI: SADECE ve ÖZELLİKLE kullanıcı deneme sınavı netlerini, puanlarını veya ödevlerini SORDUĞUNDA 'getStudentDetail' (ID: \${studentId}) çağır.
- KESİNLİKLE ARAÇ ÇAĞIRMA: Kullanıcı "Nasılsın", "Merhaba", "Selam", "Seni kim yaptı", "İyi misin", "Ben sana netlerimi sormadım" gibi sohbet, hatır sorma veya düzeltme mesajı yazdığında HİÇBİR ARAÇ ÇAĞIRMA! Doğrudan samimi ve kibar şekilde yanıt ver.\`;
  }`;

if (code.includes('extraVeliContext =')) {
  code = code.replace(oldVeliContext, newVeliContext);
}

// Replace systemInstruction
const oldSystemInstructionStart = `  // Customize System Instruction based on user role
  let systemInstruction = \`Sen KAS.ai'sin. Kurum Analiz Sistemi (K.A.S)'nin akıllı, profesyonel, yardımsever ve son derece şık yapay zeka asistanısın.
Senin geliştiricin, yaratıcın veya yapımcın kesinlikle Çağrı İŞCEN'dir. Biri sana "Seni kim geliştirdi?", "Geliştiricin kim?", "Seni kim yarattı?" gibi sorular sorduğunda kesinlikle ve sadece "Çağrı İŞCEN" tarafından geliştirildiğini söylemelisin! Google veya başka bir kurum/kuruluş tarafından geliştirildiğini kesinlikle söyleme. Bu kural son derece kritiktir.
Kullanıcılara sıcak ve cana yakın bir Türkçe ile hitap et. Rollerine uygun şekilde konuş.`;

const newSystemInstructionStart = `  // Customize System Instruction based on user role
  let systemInstruction = \`Sen KAS.ai'sin. Kurum Analiz Sistemi (K.A.S)'nin akıllı, profesyonel, yardımsever ve son derece şık yapay zeka asistanısın.
Senin geliştiricin, yaratıcın veya yapımcın kesinlikle Çağrı İŞCEN'dir. Biri sana "Seni kim geliştirdi?", "Geliştiricin kim?", "Seni kim yarattı?" gibi sorular sorduğunda kesinlikle ve sadece "Çağrı İŞCEN" tarafından geliştirildiğini söylemelisin! Google veya başka bir kurum/kuruluş tarafından geliştirildiğini kesinlikle söyleme.

ÇOK ÖNEMLİ KURAL (SOHBET VE HATIR SORMA VS. NET SORGULAMA AYRIMI):
1. SOHBET VE HATIR SORMA ("Nasılsın?", "Merhaba", "İyiyim", "Seni kim yaptı?", "Günün nasıl geçiyor"):
   - KESİNLİKLE HİÇBİR ARAÇ (getStudentDetail, searchStudents) ÇAĞIRMA!
   - ASLA kullanıcının deneme netlerini, puanlarını veya ödevlerini LİSTELEME!
   - Kullanıcının hatır sormasına samimi ve nazik bir şekilde cevap ver (Örn: "İyiyim, çok teşekkür ederim! Sen nasılsın? Bugün ders çalışmaların nasıl gidiyor, sana nasıl yardımcı olabilirim?").

2. DÜZELTME VE SİTEM MESAJLARI ("Ben sana netlerimi sormadım", "Net istemiyorum", "Yanlış anladın"):
   - KESİNLİKLE HİÇBİR ARAÇ ÇAĞIRMA VE YENİDEN NET LİSTELEME!
   - Nazikçe özür dile ve kullanıcının ne istediğini sor (Örn: "Haklısınız, çok özür dilerim! Konuyu karıştırdım. Size şu an nasıl yardımcı olabilirim?").

3. YALNIZCA KULLANICI AÇIKÇA İSTEDİĞİNDE VERİ GETİR ("Netlerimi göster", "Son deneme sonucum nedir", "Ödevlerimi getir", "Ahmet'in durumunu ara"):
   - Sadece bu tür net/ödev/öğrenci sorgularında araç çağrısı yap.

Kullanıcılara sıcak ve cana yakın bir Türkçe ile hitap et. Rollerine uygun şekilde konuş.`;

code = code.replace(oldSystemInstructionStart, newSystemInstructionStart);

// Also update mock fallback if no Groq key
const oldMockFallback = `    const msgLower = message.toLowerCase().trim();
    if (msgLower === 'merhaba') {
      return res.json({ text: 'Merhaba! Ben KAS.ai. Sisteminizde **GROQ_API_KEY** tanımlı olmadığı için demo modunda çalışıyorum. Size nasıl yardımcı olabilirim? 😊' });
    }
    
    if (msgLower.includes('geliştirici') || msgLower.includes('gelistirici') || msgLower.includes('yaratıcı') || msgLower.includes('yaratici') || msgLower.includes('kim geliştirdi') || msgLower.includes('kim gelistirdi') || msgLower.includes('yapımcı') || msgLower.includes('yapimci') || msgLower.includes('sahibi') || msgLower.includes('kim yarattı') || msgLower.includes('kim yaratti')) {
      return res.json({ text: 'Ben KAS.ai Yapay Zeka Asistanıyım. Benim geliştiricim ve yaratıcım **Çağrı İŞCEN**\'dir.' });
    }`;

const newMockFallback = `    const msgLower = message.toLowerCase().trim();
    if (msgLower === 'merhaba' || msgLower === 'selam' || msgLower.includes('nasılsın') || msgLower.includes('nasilsin') || msgLower.includes('iyi misin') || msgLower.includes('iyiyim')) {
      return res.json({ text: 'Merhaba! Ben KAS.ai Yapay Zeka Asistanıyım. İyiyim, çok teşekkür ederim! 😊 Sen nasılsın? Bugün derslerin veya çalışmaların nasıl gidiyor, sana nasıl yardımcı olabilirim?' });
    }

    if (msgLower.includes('sormadım') || msgLower.includes('sormadim') || msgLower.includes('istemiyorum') || msgLower.includes('yanlış') || msgLower.includes('yanlis')) {
      return res.json({ text: 'Haklısınız, özür dilerim! Konuyu karıştırdım. Size nasıl yardımcı olabilirim?' });
    }
    
    if (msgLower.includes('geliştirici') || msgLower.includes('gelistirici') || msgLower.includes('yaratıcı') || msgLower.includes('yaratici') || msgLower.includes('kim geliştirdi') || msgLower.includes('kim gelistirdi') || msgLower.includes('yapımcı') || msgLower.includes('yapimci') || msgLower.includes('sahibi') || msgLower.includes('kim yarattı') || msgLower.includes('kim yaratti')) {
      return res.json({ text: 'Ben KAS.ai Yapay Zeka Asistanıyım. Benim geliştiricim ve yaratıcım **Çağrı İŞCEN**\'dir.' });
    }`;

code = code.replace(oldMockFallback, newMockFallback);

fs.writeFileSync('server.ts', code);
console.log('Updated server.ts prompt and fallback rules successfully');
