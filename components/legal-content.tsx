'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { LanguageSwitcher, useI18n, type Language } from '@/components/i18n-provider'

export type LegalKind = 'terms' | 'privacy'
type Section = { heading: string; body: string[] }
export type LegalDoc = { title: string; updated: string; sections: Section[] }

const legalContent: Record<Language, Record<LegalKind, LegalDoc>> = {
  en: {
    terms: {
      title: 'Terms of Service', updated: 'Last updated: September 6, 2026',
      sections: [
        { heading: 'Using Pexiloq', body: ['Pexiloq helps you create and share a personal page for your links, projects, and profile. You are responsible for the information you publish and for keeping your account secure.'] },
        { heading: 'Acceptable use', body: ['Do not use Pexiloq to publish unlawful, abusive, deceptive, infringing, or harmful content. We may suspend accounts that violate these terms or put the service and its users at risk.'] },
        { heading: 'Your content', body: ['You retain ownership of the content you add. You grant Pexiloq permission to store, display, and process that content only as needed to operate and improve the service.'] },
        { heading: 'Service changes', body: ['We may update, suspend, or discontinue features with reasonable notice when practical. The service is provided as available, without guarantees that it will always be uninterrupted.'] },
        { heading: 'Contact', body: ['Questions about these terms can be sent to Tisk.address@gmail.com.'] },
      ],
    },
    privacy: {
      title: 'Privacy Policy', updated: 'Last updated: September 6, 2026',
      sections: [
        { heading: 'Information we collect', body: ['We collect account details such as your name and email address, the profile content you choose to publish, and technical information needed to keep Pexiloq secure and reliable.'] },
        { heading: 'How we use information', body: ['We use information to authenticate you, save and display your profile, provide support, prevent abuse, and improve the service. We do not sell your personal information.'] },
        { heading: 'Firebase', body: ['Pexiloq uses Firebase Authentication, Firestore, and Storage to securely provide account, profile, and media features. Google, Microsoft, or Apple may process information according to their own privacy policies when you use those sign-in methods.'] },
        { heading: 'Your choices', body: ['You may update your profile, delete content, or request account deletion by contacting us. You can also stop using a social sign-in provider at any time through that provider.'] },
        { heading: 'Contact', body: ['Privacy questions can be sent to Tisk.address@gmail.com.'] },
      ],
    },
  },
  ja: {
    terms: {
      title: '利用規約', updated: '最終更新: 2026年9月6日',
      sections: [
        { heading: 'Pexiloqの利用', body: ['Pexiloqは、あなたのリンク・プロジェクト・プロフィールを一つの場所にまとめて共有できるサービスです。公開する情報の責任と、アカウントの安全確保はあなたにあります。'] },
        { heading: '適切な利用', body: ['Pexiloqを違法・虐待的・欺瞞的・権利侵害・有害な内容の公開に利用しないでください。規約違反やサービス・利用者へのリスクがある場合、アカウントを停止することがあります。'] },
        { heading: 'あなたのコンテンツ', body: ['あなたが追加したコンテンツの所有権はあなたに帰属します。Pexiloqは、サービスを運営・改善するために必要な範囲でのみ、その保存・表示・処理を行います。'] },
        { heading: 'サービスの変更', body: ['合理的な場合には予告の上で機能の更新・停止・廃止を行うことがあります。サービスは現状のまま提供され、常に中断がないことを保証するものではありません。'] },
        { heading: 'お問い合わせ', body: ['規約に関するご質問は Tisk.address@gmail.com までお送りください。'] },
      ],
    },
    privacy: {
      title: 'プライバシーポリシー', updated: '最終更新: 2026年9月6日',
      sections: [
        { heading: '収集する情報', body: ['氏名・メールアドレスなどのアカウント情報、公開するプロフィールの内容、Pexiloqの安全と信頼性の維持に必要な技術情報を収集します。'] },
        { heading: '情報の利用', body: ['認証、プロフィールの保存・表示、サポート、不正防止、サービスの改善に利用します。個人情報を販売することはありません。'] },
        { heading: 'Firebase', body: ['Pexiloqはアカウント・プロフィール・メディア機能のためにFirebase Authentication、Firestore、Storageを利用します。Google、Microsoft、Appleでのログイン時は、各社のプライバシーポリシーに従って情報が処理されることがあります。'] },
        { heading: 'あなたの選択', body: ['プロフィールの更新、コンテンツの削除、お問い合わせによるアカウント削除ができます。ソーシャルログインの利用停止も各プロバイダーでいつでも行えます。'] },
        { heading: 'お問い合わせ', body: ['プライバシーに関するご質問は Tisk.address@gmail.com までお送りください。'] },
      ],
    },
  },
  zh: {
    terms: {
      title: '服务条款', updated: '最后更新：2026年9月6日',
      sections: [
        { heading: '使用 Pexiloq', body: ['Pexiloq 帮助你为链接、项目和个人资料创建与分享专属主页。你需对自己发布的信息负责，并保障账户安全。'] },
        { heading: '可接受的使用', body: ['不得使用 Pexiloq 发布违法、辱骂性、欺骗性、侵权或有害内容。对于违反条款或危及服务及用户的行为，我们可能暂停相关账户。'] },
        { heading: '你的内容', body: ['你保留所添加内容的全部所有权。Pexiloq 仅在运营与改进服务所需范围内存储、展示和处理这些内容。'] },
        { heading: '服务变更', body: ['我们可能在实际可行时以合理通知更新、暂停或终止功能。服务按现状提供，不保证永不中断。'] },
        { heading: '联系方式', body: ['有关条款的问题可发送至 Tisk.address@gmail.com。'] },
      ],
    },
    privacy: {
      title: '隐私政策', updated: '最后更新：2026年9月6日',
      sections: [
        { heading: '收集的信息', body: ['我们收集账户信息（如姓名和电子邮件）、你选择公开的个人资料内容，以及保障 Pexiloq 安全可靠所需的技术信息。'] },
        { heading: '信息的使用', body: ['我们使用信息来验证你的身份、保存并展示你的个人资料、提供支持、防止滥用并改进服务。我们不会出售你的个人信息。'] },
        { heading: 'Firebase', body: ['Pexiloq 使用 Firebase Authentication、Firestore 和 Storage 安全地提供账户、个人资料和媒体功能。使用 Google、Microsoft 或 Apple 登录时，相关服务可能根据各自隐私政策处理信息。'] },
        { heading: '你的选择', body: ['你可以更新个人资料、删除内容，或联系我们请求删除账户。你也可以随时通过相关提供商停止使用社交登录。'] },
        { heading: '联系方式', body: ['有关隐私的问题可发送至 Tisk.address@gmail.com。'] },
      ],
    },
  },
  ko: {
    terms: {
      title: '이용약관', updated: '최종 수정: 2026년 9월 6일',
      sections: [
        { heading: 'Pexiloq 사용', body: ['Pexiloq는 링크, 프로젝트, 프로필을 한곳에 모아 공유하는 개인 페이지를 만들 수 있게 도와줍니다. 게시하는 정보와 계정 보안은 이용자의 책임입니다.'] },
        { heading: '허용되는 사용', body: ['불법, 욕설, 기만, 권리 침해 또는 유해한 콘텐츠를 게시하는 데 Pexiloq를 사용하지 마십시오. 약관 위반이나 서비스·이용자에 대한 위험이 있을 경우 계정을 정지할 수 있습니다.'] },
        { heading: '이용자의 콘텐츠', body: ['추가한 콘텐츠의 소유권은 이용자에게 있습니다. Pexiloq는 서비스 운영과 개선에 필요한 범위에서만 이를 저장·표시·처리합니다.'] },
        { heading: '서비스 변경', body: ['실질적으로 가능한 경우 합리적인 공지 후 기능을 업데이트·중단·종료할 수 있습니다. 서비스는 있는 그대로 제공되며 항상 중단이 없음을 보장하지 않습니다.'] },
        { heading: '문의', body: ['약관 관련 문의는 Tisk.address@gmail.com으로 보내주세요.'] },
      ],
    },
    privacy: {
      title: '개인정보 처리방침', updated: '최종 수정: 2026년 9월 6일',
      sections: [
        { heading: '수집하는 정보', body: ['이름과 이메일 주소 같은 계정 정보, 공개하기로 선택한 프로필 내용, Pexiloq의 안전과 신뢰성 유지에 필요한 기술 정보를 수집합니다.'] },
        { heading: '정보의 이용', body: ['인증, 프로필 저장·표시, 지원, 남용 방지, 서비스 개선에 정보를 사용합니다. 개인정보를 판매하지 않습니다.'] },
        { heading: 'Firebase', body: ['Pexiloq는 계정, 프로필, 미디어 기능을 위해 Firebase Authentication, Firestore, Storage를 사용합니다. Google, Microsoft, Apple 로그인을 사용할 때 해당 서비스는 각자의 개인정보 처리방침에 따라 정보를 처리할 수 있습니다.'] },
        { heading: '이용자의 선택', body: ['프로필을 업데이트하거나 콘텐츠를 삭제하고, 문의를 통해 계정 삭제를 요청할 수 있습니다. 소셜 로그인 사용 중단도 해당 제공자를 통해 언제든 할 수 있습니다.'] },
        { heading: '문의', body: ['개인정보 관련 문의는 Tisk.address@gmail.com으로 보내주세요.'] },
      ],
    },
  },
  es: {
    terms: {
      title: 'Términos de servicio', updated: 'Última actualización: 6 de septiembre de 2026',
      sections: [
        { heading: 'Uso de Pexiloq', body: ['Pexiloq te ayuda a crear y compartir una página personal con tus enlaces, proyectos y perfil. Eres responsable de la información que publicas y de mantener segura tu cuenta.'] },
        { heading: 'Uso aceptable', body: ['No uses Pexiloq para publicar contenido ilegal, abusivo, engañoso, infractor o dañino. Podemos suspender cuentas que incumplan estos términos o pongan en riesgo el servicio y a sus usuarios.'] },
        { heading: 'Tu contenido', body: ['Conservas la propiedad del contenido que añades. Concedes a Pexiloq permiso para almacenarlo, mostrarlo y procesarlo solo en lo necesario para operar y mejorar el servicio.'] },
        { heading: 'Cambios del servicio', body: ['Podemos actualizar, suspender o discontinuar funciones con un aviso razonable cuando sea práctico. El servicio se ofrece tal como está, sin garantías de que nunca se interrumpa.'] },
        { heading: 'Contacto', body: ['Las preguntas sobre estos términos pueden enviarse a Tisk.address@gmail.com.'] },
      ],
    },
    privacy: {
      title: 'Política de privacidad', updated: 'Última actualización: 6 de septiembre de 2026',
      sections: [
        { heading: 'Información que recopilamos', body: ['Recopilamos datos de la cuenta como tu nombre y correo, el contenido del perfil que decides publicar e información técnica necesaria para mantener Pexiloq seguro y fiable.'] },
        { heading: 'Cómo usamos la información', body: ['Usamos la información para autenticarte, guardar y mostrar tu perfil, darte soporte, prevenir abusos y mejorar el servicio. No vendemos tu información personal.'] },
        { heading: 'Firebase', body: ['Pexiloq usa Firebase Authentication, Firestore y Storage para ofrecer funciones de cuenta, perfil y medios de forma segura. Google, Microsoft o Apple pueden procesar información según sus propias políticas al usar esos métodos de acceso.'] },
        { heading: 'Tus opciones', body: ['Puedes actualizar tu perfil, eliminar contenido o solicitar el borrado de tu cuenta contactándonos. También puedes dejar de usar un proveedor de acceso social en cualquier momento desde ese proveedor.'] },
        { heading: 'Contacto', body: ['Las preguntas de privacidad pueden enviarse a Tisk.address@gmail.com.'] },
      ],
    },
  },
  fr: {
    terms: {
      title: "Conditions d'utilisation", updated: 'Dernière mise à jour : 6 septembre 2026',
      sections: [
        { heading: 'Utilisation de Pexiloq', body: ["Pexiloq vous aide à créer et partager une page personnelle pour vos liens, projets et profil. Vous êtes responsable des informations que vous publiez et de la sécurité de votre compte."] },
        { heading: 'Utilisation acceptable', body: ["N'utilisez pas Pexiloq pour publier du contenu illégal, abusif, trompeur, contrefaisant ou nuisible. Nous pouvons suspendre les comptes qui enfreignent ces conditions ou mettent en danger le service et ses utilisateurs."] },
        { heading: 'Votre contenu', body: ["Vous conservez la propriété du contenu que vous ajoutez. Vous accordez à Pexiloq la permission de stocker, afficher et traiter ce contenu uniquement dans la mesure nécessaire au fonctionnement et à l'amélioration du service."] },
        { heading: 'Évolution du service', body: ["Nous pouvons mettre à jour, suspendre ou arrêter des fonctionnalités avec un préavis raisonnable lorsque c'est possible. Le service est fourni tel quel, sans garantie d'absence d'interruption."] },
        { heading: 'Contact', body: ['Les questions sur ces conditions peuvent être envoyées à Tisk.address@gmail.com.'] },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité', updated: 'Dernière mise à jour : 6 septembre 2026',
      sections: [
        { heading: 'Informations collectées', body: ["Nous collectons les informations du compte telles que votre nom et votre adresse e-mail, le contenu du profil que vous choisissez de publier, et les informations techniques nécessaires à la sécurité et à la fiabilité de Pexiloq."] },
        { heading: 'Utilisation des informations', body: ["Nous utilisons ces informations pour vous authentifier, enregistrer et afficher votre profil, fournir de l'aide, prévenir les abus et améliorer le service. Nous ne vendons pas vos informations personnelles."] },
        { heading: 'Firebase', body: ["Pexiloq utilise Firebase Authentication, Firestore et Storage pour fournir de manière sécurisée les fonctions de compte, de profil et de médias. Google, Microsoft ou Apple peuvent traiter des informations selon leurs propres politiques lors de l'utilisation de ces méthodes de connexion."] },
        { heading: 'Vos choix', body: ["Vous pouvez mettre à jour votre profil, supprimer du contenu ou demander la suppression de votre compte en nous contactant. Vous pouvez aussi cesser d'utiliser un fournisseur de connexion sociale à tout moment via ce fournisseur."] },
        { heading: 'Contact', body: ['Les questions de confidentialité peuvent être envoyées à Tisk.address@gmail.com.'] },
      ],
    },
  },
  de: {
    terms: {
      title: 'Nutzungsbedingungen', updated: 'Zuletzt aktualisiert: 6. September 2026',
      sections: [
        { heading: 'Nutzung von Pexiloq', body: ['Pexiloq hilft dir, eine persönliche Seite für deine Links, Projekte und dein Profil zu erstellen und zu teilen. Du bist für die veröffentlichten Informationen und die Sicherheit deines Kontos verantwortlich.'] },
        { heading: 'Zulässige Nutzung', body: ['Nutze Pexiloq nicht, um rechtswidrige, missbräuchliche, irreführende, rechtsverletzende oder schädliche Inhalte zu veröffentlichen. Wir können Konten sperren, die diese Bedingungen verletzen oder den Dienst und seine Nutzer gefährden.'] },
        { heading: 'Deine Inhalte', body: ['Du behältst das Eigentum an den von dir hinzugefügten Inhalten. Du gewährst Pexiloq die Erlaubnis, diese Inhalte nur zu speichern, anzuzeigen und zu verarbeiten, soweit dies für den Betrieb und die Verbesserung des Dienstes erforderlich ist.'] },
        { heading: 'Änderungen des Dienstes', body: ['Wir können Funktionen mit angemessener Vorankündigung aktualisieren, sperren oder einstellen, sofern dies praktikabel ist. Der Dienst wird wie verfügbar bereitgestellt, ohne Garantie auf ununterbrochenen Betrieb.'] },
        { heading: 'Kontakt', body: ['Fragen zu diesen Bedingungen können an Tisk.address@gmail.com gesendet werden.'] },
      ],
    },
    privacy: {
      title: 'Datenschutzerklärung', updated: 'Zuletzt aktualisiert: 6. September 2026',
      sections: [
        { heading: 'Erhobene Informationen', body: ['Wir erheben Kontodaten wie Name und E-Mail-Adresse, den Profilinhalt, den du veröffentlichst, sowie technische Informationen, die erforderlich sind, um Pexiloq sicher und zuverlässig zu halten.'] },
        { heading: 'Verwendung der Informationen', body: ['Wir verwenden Informationen, um dich zu authentifizieren, dein Profil zu speichern und anzuzeigen, Support zu leisten, Missbrauch zu verhindern und den Dienst zu verbessern. Wir verkaufen deine persönlichen Daten nicht.'] },
        { heading: 'Firebase', body: ['Pexiloq verwendet Firebase Authentication, Firestore und Storage, um Konto-, Profil- und Medienfunktionen sicher bereitzustellen. Google, Microsoft oder Apple können Informationen nach ihren eigenen Datenschutzrichtlinien verarbeiten, wenn du diese Anmeldemethoden nutzt.'] },
        { heading: 'Deine Entscheidungen', body: ['Du kannst dein Profil aktualisieren, Inhalte löschen oder per Kontakt die Löschung deines Kontos beantragen. Du kannst die Nutzung eines Social-Login-Anbieters jederzeit über diesen beenden.'] },
        { heading: 'Kontakt', body: ['Fragen zum Datenschutz können an Tisk.address@gmail.com gesendet werden.'] },
      ],
    },
  },
  pt: {
    terms: {
      title: 'Termos de serviço', updated: 'Atualizado em: 6 de setembro de 2026',
      sections: [
        { heading: 'Uso do Pexiloq', body: ['O Pexiloq ajuda você a criar e compartilhar uma página pessoal para seus links, projetos e perfil. Você é responsável pelas informações que publica e pela segurança da sua conta.'] },
        { heading: 'Uso aceitável', body: ['Não use o Pexiloq para publicar conteúdo ilegal, abusivo, enganoso, infrator ou nocivo. Podemos suspender contas que violem estes termos ou coloquem o serviço e seus usuários em risco.'] },
        { heading: 'Seu conteúdo', body: ['Você mantém a propriedade do conteúdo que adiciona. Concede ao Pexiloq permissão para armazenar, exibir e processar esse conteúdo apenas conforme necessário para operar e melhorar o serviço.'] },
        { heading: 'Mudanças no serviço', body: ['Podemos atualizar, suspender ou descontinuar recursos com aviso razoável quando for prático. O serviço é fornecido como está, sem garantia de que nunca será interrompido.'] },
        { heading: 'Contato', body: ['Dúvidas sobre estes termos podem ser enviadas para Tisk.address@gmail.com.'] },
      ],
    },
    privacy: {
      title: 'Política de privacidade', updated: 'Atualizado em: 6 de setembro de 2026',
      sections: [
        { heading: 'Informações que coletamos', body: ['Coletamos dados da conta, como seu nome e e-mail, o conteúdo do perfil que você escolhe publicar e informações técnicas necessárias para manter o Pexiloq seguro e confiável.'] },
        { heading: 'Como usamos as informações', body: ['Usamos as informações para autenticar você, salvar e exibir seu perfil, dar suporte, prevenir abusos e melhorar o serviço. Não vendemos seus dados pessoais.'] },
        { heading: 'Firebase', body: ['O Pexiloq usa Firebase Authentication, Firestore e Storage para fornecer de forma segura os recursos de conta, perfil e mídia. Google, Microsoft ou Apple podem processar informações de acordo com suas próprias políticas ao usar esses métodos de login.'] },
        { heading: 'Suas escolhas', body: ['Você pode atualizar seu perfil, excluir conteúdo ou solicitar a exclusão da conta entrando em contato. Também pode parar de usar um provedor de login social a qualquer momento por meio dele.'] },
        { heading: 'Contato', body: ['Dúvidas sobre privacidade podem ser enviadas para Tisk.address@gmail.com.'] },
      ],
    },
  },
  hi: {
    terms: {
      title: 'सेवा की शर्तें', updated: 'अंतिम अद्यतन: 6 सितंबर 2026',
      sections: [
        { heading: 'Pexiloq का उपयोग', body: ['Pexiloq आपको अपने लिंक, प्रोजेक्ट और प्रोफ़ाइल के लिए एक व्यक्तिगत पेज बनाने और साझा करने में मदद करता है। आप अपनी प्रकाशित जानकारी और अपने खाते की सुरक्षा के लिए ज़िम्मेदार हैं।'] },
        { heading: 'स्वीकार्य उपयोग', body: ['गैरकानूनी, अपमानजनक, भ्रामक, अधिकार-उल्लंघनकारी या हानिकारक सामग्री प्रकाशित करने के लिए Pexiloq का उपयोग न करें। इन शर्तों का उल्लंघन करने या सेवा एवं उपयोगकर्ताओं को जोखिम में डालने वाले खातों को हम निलंबित कर सकते हैं।'] },
        { heading: 'आपकी सामग्री', body: ['आपने जो सामग्री जोड़ी है उसका स्वामित्व आपके पास रहता है। आप Pexiloq को उस सामग्री को केवल सेवा के संचालन और सुधार के लिए आवश्यक सीमा तक संग्रहीत, प्रदर्शित और संसाधित करने की अनुमति देते हैं।'] },
        { heading: 'सेवा में परिवर्तन', body: ['व्यावहारिक होने पर हम उचित सूचना के साथ सुविधाओं को अद्यतन, निलंबित या बंद कर सकते हैं। सेवा उपलब्धता के अनुसार दी जाती है, बिना किसी निरंतरता की गारंटी के।'] },
        { heading: 'संपर्क', body: ['इन शर्तों से संबंधित प्रश्न Tisk.address@gmail.com पर भेजे जा सकते हैं।'] },
      ],
    },
    privacy: {
      title: 'गोपनीयता नीति', updated: 'अंतिम अद्यतन: 6 सितंबर 2026',
      sections: [
        { heading: 'हम जो जानकारी एकत्र करते हैं', body: ['हम आपका नाम और ईमेल पता जैसी खाता जानकारी, आपके द्वारा प्रकाशित करने के लिए चुनी गई प्रोफ़ाइल सामग्री, और Pexiloq को सुरक्षित और विश्वसनीय रखने के लिए आवश्यक तकनीकी जानकारी एकत्र करते हैं।'] },
        { heading: 'जानकारी का उपयोग', body: ['हम जानकारी का उपयोग आपको प्रमाणित करने, आपकी प्रोफ़ाइल को सहेजने और प्रदर्शित करने, सहायता देने, दुरुपयोग रोकने और सेवा सुधारने के लिए करते हैं। हम आपकी व्यक्तिगत जानकारी नहीं बेचते।'] },
        { heading: 'Firebase', body: ['Pexiloq खाता, प्रोफ़ाइल और मीडिया सुविधाएँ सुरक्षित रूप से प्रदान करने के लिए Firebase Authentication, Firestore और Storage का उपयोग करता है। Google, Microsoft या Apple उन साइन-इन विधियों के उपयोग पर अपनी गोपनीयता नीतियों के अनुसार जानकारी संसाधित कर सकते हैं।'] },
        { heading: 'आपके विकल्प', body: ['आप अपनी प्रोफ़ाइल अद्यतन कर सकते हैं, सामग्री हटा सकते हैं, या हमसे संपर्क करके खाता हटाने का अनुरोध कर सकते हैं। आप किसी सामाजिक साइन-इन प्रदाता का उपयोग उसके माध्यम से कभी भी बंद कर सकते हैं।'] },
        { heading: 'संपर्क', body: ['गोपनीयता से संबंधित प्रश्न Tisk.address@gmail.com पर भेजे जा सकते हैं।'] },
      ],
    },
  },
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { t } = useI18n()
  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-10">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t('backToSignup')}</Link>
        <LanguageSwitcher compact />
      </header>
      <LegalBody kind={kind} />
    </main>
  )
}

function LegalBody({ kind }: { kind: LegalKind }) {
  const { language } = useI18n()
  const doc = legalContent[language][kind]
  return (
    <article className="mx-auto max-w-3xl py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pexiloq</p>
      <h1 className="mt-4 text-4xl font-medium tracking-[-0.07em] sm:text-5xl">{doc.title}</h1>
      <p className="mt-5 text-sm text-muted-foreground">{doc.updated}</p>
      <div className="mt-12 space-y-10 leading-7">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-medium tracking-[-0.04em]">{section.heading}</h2>
            {section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] text-foreground/80">{paragraph}</p>)}
          </section>
        ))}
      </div>
    </article>
  )
}

export function LegalDialog({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  const { t, language } = useI18n()
  const doc = legalContent[language][kind]
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]" onMouseDown={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="legal-dialog-title" onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-background shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">pexiloq / {kind === 'terms' ? t('terms') : t('privacy')}</p>
            <h2 id="legal-dialog-title" className="mt-1 truncate text-lg font-medium tracking-[-0.03em]">{doc.title}</h2>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="grid size-11 min-h-[44px] min-w-[44px] place-items-center shrink-0 rounded-full border text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 leading-7">
          <p className="text-xs text-muted-foreground">{doc.updated}</p>
          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-7 first:mt-0">
              <h3 className="text-base font-medium tracking-[-0.02em]">{section.heading}</h3>
              {section.body.map((paragraph) => <p key={paragraph} className="mt-2 text-sm text-foreground/75">{paragraph}</p>)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}