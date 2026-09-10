import React from 'react';
import { GraduationCap, Award, ExternalLink, CheckCircle2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  highlight: string;
  link: string;
}

const COURSES: Course[] = [
  {
    id: '1',
    title: 'Auxiliar Administrativo com Excel',
    category: 'Administração',
    highlight: 'O cargo com mais vagas abertas em Natal',
    link: 'https://empregodorn.jemp.me/auxiliaradministrativo?src=natalvagas_home'
  },
  {
    id: '2',
    title: 'Atendente de Farmácia & Balconista',
    category: 'Saúde & Comércio',
    highlight: 'Alta demanda em redes de farmácias do RN',
    link: 'https://empregodorn.jemp.me/curso-farmacia?src=natalvagas_home'
  },
  {
    id: '3',
    title: 'Operador de Caixa & Frente de Loja',
    category: 'Varejo & Supermercados',
    highlight: 'Ideal para 1º emprego em supermercados e shoppings',
    link: 'https://empregodorn.jemp.me/curso-operador-de-caixa?src=natalvagas_home'
  },
  {
    id: '4',
    title: 'Recepcionista & Atendimento ao Cliente',
    category: 'Hotelaria & Clínicas',
    highlight: 'Muito requisitado em clínicas e hotéis de Ponta Negra',
    link: 'https://empregodorn.jemp.me/curso-recepcionista?src=natalvagas_home'
  }
];

export const CourseRecommendations: React.FC = () => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" /> Qualificação Profissional no RN
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            Cursos com Certificado Válido para o seu Currículo
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Candidatos com cursos profissionalizantes têm até 4x mais chances de serem chamados para entrevistas.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <Award className="w-4 h-4" /> Certificado reconhecido
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COURSES.map((course) => (
          <a
            key={course.id}
            href={course.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                {course.category}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-2 group-hover:text-brand-600 transition-colors">
                {course.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed flex items-start gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{course.highlight}</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-brand-600">
              <span>Conhecer Curso</span>
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
export default CourseRecommendations;
