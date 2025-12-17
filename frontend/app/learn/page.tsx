"use client"
import Link from 'next/link';

export default function Home() {
  const resources = {
    html: [
      {
        title: 'HTML5 Notes for Professionals (GoalKicker)',
        desc: 'Comprehensive reference compiled from Stack Overflow.',
        url: 'https://books.goalkicker.com/HTML5Book/HTML5NotesForProfessionals.pdf',
      },
      {
        title: 'TutorialsPoint HTML Tutorial PDF',
        desc: 'Complete beginner-to-advanced guide.',
        url: 'https://www.tutorialspoint.com/html/html_tutorial.pdf',
      },
      {
        title: 'JavaScript & Friends Cheat Sheet (incl. HTML)',
        desc: 'Quick reference cheat sheet.',
        url: 'https://websitesetup.org/wp-content/uploads/2020/09/Javascript-Cheat-Sheet.pdf',
      },
    ],
    css: [
      {
        title: 'CSS Notes for Professionals (GoalKicker)',
        desc: 'Professional-level reference from Stack Overflow.',
        url: 'https://books.goalkicker.com/CSSBook/CSSNotesForProfessionals.pdf',
      },
      {
        title: 'TutorialsPoint CSS Tutorial PDF',
        desc: 'Full coverage of CSS basics to advanced.',
        url: 'https://www.tutorialspoint.com/css/css_tutorial.pdf',
      },
      {
        title: 'CSS Cheat Sheet (Hostinger)',
        desc: 'Modern cheat sheet with examples.',
        url: 'https://www.hostinger.com/tutorials/css-cheat-sheet', // Users can print/save as PDF
      },
    ],
    javascript: [
      {
        title: 'JavaScript Notes for Professionals (GoalKicker)',
        desc: 'In-depth reference from Stack Overflow.',
        url: 'https://books.goalkicker.com/JavaScriptBook/JavaScriptNotesForProfessionals.pdf',
      },
      {
        title: 'TutorialsPoint JavaScript Tutorial PDF',
        desc: 'Step-by-step guide with examples.',
        url: 'https://www.tutorialspoint.com/javascript/javascript_tutorial.pdf',
      },
      {
        title: 'Beginner’s Essential JavaScript Cheat Sheet',
        desc: 'Concise cheat sheet for quick reference.',
        url: 'https://websitesetup.org/wp-content/uploads/2020/09/Javascript-Cheat-Sheet.pdf',
      },
    ],
    aiMachineLearning: [
      {
        title: 'Machine Learning Notes for Professionals (GoalKicker)',
        desc: 'Comprehensive ML reference from Stack Overflow.',
        url: 'https://books.goalkicker.com/MachineLearningBook/MachineLearningNotesForProfessionals.pdf',
      },
      {
        title: 'TutorialsPoint Machine Learning Tutorial PDF',
        desc: 'Beginner-to-advanced ML guide.',
        url: 'https://www.tutorialspoint.com/machine_learning/machine_learning_tutorial.pdf',
      },
      {
        title: 'Machine Learning Cheat Sheet (DataCamp)',
        desc: 'Quick algorithms overview with pros/cons.',
        url: 'https://www.datacamp.com/cheat-sheet/machine-learning-cheat-sheet', // Save as PDF via browser
      },
    ],
    webDevelopment: [
      {
        title: 'Full Stack Web Development Notes (MRCET)',
        desc: 'Complete notes covering HTML, CSS, JS, Node.js, and more.',
        url: 'https://mrcet.com/downloads/digital_notes/CSE/III%20Year/AIML/Full%20Stack%20Development-Digital%20Notes.pdf',
      },
      {
        title: 'TutorialsPoint Website Development Tutorial PDF',
        desc: 'From basics to publishing web apps.',
        url: 'https://www.tutorialspoint.com/website_development/website_development_tutorial.pdf',
      },
      {
        title: 'GeeksforGeeks Web Development Tutorial',
        desc: 'Interactive guide (save as PDF).',
        url: 'https://www.geeksforgeeks.org/web-tech/web-technology/',
      },
    ],
    cloudComputing: [
      {
        title: 'TutorialsPoint Cloud Computing Tutorial PDF',
        desc: 'Beginner-friendly overview of cloud concepts.',
        url: 'https://www.tutorialspoint.com/cloud_computing/cloud_computing_tutorial.pdf',
      },
      {
        title: 'AWS Cloud Practitioner Study Notes (CLF-C02)',
        desc: 'Free notes for AWS beginners.',
        url: 'https://kananinirav.com/aws-cloud-practitioner-study-notes-clf-c02/',
      },
      {
        title: 'Azure Fundamentals Notes',
        desc: 'Microsoft Azure beginner guide (save as PDF).',
        url: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/get-started/azure-fundamentals',
      },
      {
        title: 'Google Cloud Beginner Notes',
        desc: 'GCP essentials for starters (save as PDF).',
        url: 'https://cloud.google.com/docs/overview',
      },
    ],
  };

  return (
    <>
      <header className="bg-gradient-to-r from-purple-900 to-pink-400 text-white text-center py-16 shadow-lg">
        <h1 className="text-5xl font-bold mb-4">Free Coding Notes</h1>
        <p className="text-xl max-w-3xl mx-auto">
          Downloadable PDF notes, cheat sheets, and tutorials for HTML, CSS, JavaScript, AI/ML, Web Development, and Cloud Computing – Professional, easy-to-read, and 100% free!
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">HTML Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.html.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">CSS Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.css.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">JavaScript Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.javascript.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">AI & Machine Learning Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.aiMachineLearning.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">Web Development Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.webDevelopment.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-700 border-b-4 border-blue-700 pb-2 mb-8">Cloud Computing Resources</h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.cloudComputing.map((item, i) => (
              <li key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-indigo-600 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-gray-600 mt-2">{item.desc}</p>
                <span className="inline-block mt-4 text-sm text-gray-500">↗ Opens in new tab (Direct PDF where available)</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="bg-gray-800 text-white text-center py-8">
        <p className="text-lg">&copy; 2025 Free Coding Notes Index</p>
        <p className="text-sm mt-2">All resources are free and linked from public sources.</p>
      </footer>
    </>
  );
}