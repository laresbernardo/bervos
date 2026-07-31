import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Globe2, Shuffle } from 'lucide-react';

interface SampleStory {
  id: string;
  countryES: string;
  countryEN: string;
  flag: string;
  titleES: string;
  titleEN: string;
  bodyES: string[];
  bodyEN: string[];
}

const SAMPLE_STORIES: SampleStory[] = [
  {
    id: 'oman',
    countryES: 'Omán',
    countryEN: 'Oman',
    flag: '🇴🇲',
    titleES: 'Triple victoria',
    titleEN: 'Triple Victory',
    bodyES: [
      'Un parpadeo rojo en la pantalla del radar bastaba para detener el flujo del petróleo mundial. Aziza apoyó las palmas sobre la caoba helada de la sala de crisis, sintiendo el leve roce del hilo de plata de su abaya contra las muñecas. A quince millas de la costa, donde el canal se angosta hasta parecer una garganta de roca, dos buques cisterna de banderas rivales permanecían con las calderas apagadas, rodeados por tres fragatas en zafarrancho. Llevaba despierta desde las cuatro redactando la propuesta neutral en tres idiomas; si fallaba en una sola subordinada, el bloqueo militar sería irreversible antes del mediodía.',
      'Para cuando el sol del mediodía cayó a plomo sobre el puerto, los gritos en inglés y farsi cruzaban la mesa redonda como esquirlas. Los agregados militares apretaban los nudillos, incapaces de ceder un solo nudo de patrullaje sin perder el honor frente a sus cancillerías. Aziza no elevó la voz. Con un gesto imperceptible, ordenó servir el café ritual; la llegada de las pequeñas finjan humeantes con cardamomo impuso una tregua muta de tres minutos, dictada por la vieja etiqueta de la hikma. Nadie podía gritar sosteniendo una porcelana ardiente entre los dedos.',
      'El destello verde de la alerta satelital confirmó a última hora el viraje de las fragatas mar adentro. Aziza recogió el acta firmada sin permitir que sus ojos traicionaran el alivio, devolvió la inclinación de cabeza a ambos embajadores con una cortesía impenetrable y atravesó el patio de moscas y salitre. En la quietud de su casa, con el aire acondicionado devolviéndole el aliento, se despojó del velo sheila y escuchó la respiración pausada de sus hijos dormidos en la planta alta.'
    ],
    bodyEN: [
      'A red blink on the radar screen was enough to halt the global flow of oil. Aziza rested her palms against the chilled mahogany of the crisis room table, feeling the soft brush of silver thread on her abaya cuffs. Fifteen miles off the coast, where the channel narrows to a rocky throat, two tanker ships from rival flags sat with doused boilers, surrounded by three frigates on battle readiness. She had been awake since four drafting a neutral compromise in three languages; missing a single clause meant military blockade before noon.',
      'By noon, harsh exchanges in English and Farsi flew across the conference table like shrapnel. Military attachés clenched their knuckles, unwilling to yield a single knot of patrol without losing face to their ministries. Aziza never raised her voice. With an imperceptible gesture, she ordered the ritual qahwa served; the arrival of steaming finjan cups with cardamom imposed a silent three-minute truce dictated by the ancient protocol of hikma.',
      'The green flash of a satellite alert at dusk confirmed the frigates turning back out to sea. Aziza gathered the signed protocol without letting her eyes betray relief, returned a subtle nod to both ambassadors, and walked out across the salt-dusted courtyard. In the quiet of her home, she shed her sheila veil and listened to the peaceful breathing of her children sleeping upstairs.'
    ]
  },
  {
    id: 'nigeria',
    countryES: 'Nigeria',
    countryEN: 'Nigeria',
    flag: '🇳🇬',
    titleES: 'Notificaciones y seguidores',
    titleEN: 'Notifications and Followers',
    bodyES: [
      'Entre el vapor del aceite donde freían puff-puff a la salida del instituto y el sopor de las aulas, el contador invisible que solo la voz narrativa registraba marcaba ya doscientas revisiones. El pulgar deslizaba la pantalla en cada pausa: al cruzar la calle o al esperar un cambio de semáforo. Un mensaje de su compañero de banco sobre la guía de matemáticas quedó soterrado bajo ochenta notificaciones de perfiles sin rostro que dejaban iconos de fuego en su último video.',
      'Tolu no respondió; los mensajes personales exigían palabras y explicaciones, mientras que la barra de notificaciones le regalaba una dosis limpia de aprobación sin pedir nada a cambio. Al terminar el día, Tolu había acumulado quinientas ochenta y cinco miradas a la pantalla, sin llevar la cuenta ni ser consciente de la cifra. Cenando suya sobre papel de periódico, sujetó el teléfono para ajustar su decimoquinta toma.',
      'A las once, encendió el cristal una vez más para revisar sus métricas antes de dormir. En el brillo azulado del display, sintió que el planeta entero lo miraba, sin notar la soledad del cuarto donde nadie decía su nombre.'
    ],
    bodyEN: [
      'Between the sizzle of oil frying puff-puff outside the school gates and the humid daze of the classrooms, an invisible counter logged two hundred screen checks before noon. Tolu’s thumb swiped the glass at every pause: crossing the street or waiting at a traffic light. A text message from his desk mate about the math guide sank beneath eighty notifications from faceless profiles dropping fire icons on his latest video.',
      'Tolu didn’t reply; personal messages demanded explanations, whereas the notification bar delivered a clean hit of approval without asking for anything in return. By sunset, Tolu had logged five hundred and eighty-five glances at the screen, unaware of the total. Eating suya off newspaper sheets, he raised his phone to frame his fifteenth take of the day.',
      'At eleven, he illuminated the glass one last time to review his metrics before sleep. In the cool blue glow of the display, he felt the entire planet watching him, unmindful of the quiet bedroom where nobody spoke his name out loud.'
    ]
  },
  {
    id: 'cuba',
    countryES: 'Cuba',
    countryEN: 'Cuba',
    flag: '🇨🇺',
    titleES: 'El confesionario alegre',
    titleEN: 'The Joyful Confessional',
    bodyES: [
      'Desde que instaló su sillón de hierro Koken de mil nueve cincuenta y cuatro en el zaguán más fresco de la calle Villegas, a tres cuadras del puerto, Lazarito se convirtió en el corazón del barrio. Aunque no emite una sola vocal desde niño, no existe persona más conversadora ni de mejor humor. Su idioma no necesita cuerdas vocales: dos toques de nudillos en el reposabrazos significan "pasa", una palmadita suave en la mejilla anuncia que la barba quedó limpia, y el repiqueteo de sus tijeras al aire marca el compás.',
      'Por su sillón pasa el chofer de almendrón agobiado por el carburador, y la trulla de Don Humberto con sus dos niños traviesos. Sentarse allí es como entrar a un confesionario alegre: todos desahogan sus penas y salen a la calle más livianos, sin pelos en la nuca y sin peso en el pecho, sabiendo que el barbero los escucha con una sonrisa franca que jamás interrumpirá para hablar de sí mismo.',
      'Al caer la tarde, limpia los pelajes del suelo con un cepillo de cerdas de pita y ordena las toallas limpias. Antes de cerrar las rejas del zaguán, le guiña el ojo a su propio reflejo en el espejo gastado y regala una última sonrisa al pasaje que se llena de música nocturna.'
    ],
    bodyEN: [
      'Since installing his 1954 Koken iron barber chair in the coolest breezeway on Villegas Street, three blocks from Havana harbor, Lazarito became the heartbeat of the neighborhood. Though he hasn’t uttered a vowel since childhood, there is no more conversational or cheerful soul in the city. His language needs no vocal cords: two knuckle taps on the armrest mean "step right in," a soft pat on the cheek signals a clean shave, and the rhythmic snap of his scissors in the air sets the tempo.',
      'Through his chair passes the classic car driver burdened by a failing carburetor, and Don Humberto’s lively grandchildren. Sitting there is like entering a joyful confessional: everyone pours out their troubles and steps back onto the street lighter, neatly trimmed and relieved of weight, knowing the barber listened with a genuine smile that will never interrupt to talk about himself.',
      'As dusk falls, he sweeps up hair trimmings with a palm-fiber brush and aligns clean towels on the rack. Before locking the iron gates, he winks at his reflection in the worn mirror and gifts one last smile to the alleyway filling with evening music.'
    ]
  },
  {
    id: 'andorra',
    countryES: 'Andorra',
    countryEN: 'Andorra',
    flag: '🇦🇩',
    titleES: 'El cazador de inviernos',
    titleEN: 'The Winter Hunter',
    bodyES: [
      'El estruendo de la dinamita retumbó en la cara norte antes de que el sol iluminara los tejados de pizarra. Marc ajustó la emisora al arnés y esperó a que la nube de nieve se asentara en la canal. Cuatro años sin probar el verano dejan una costra en la piel y arrugas fijas alrededor de los ojos. Mientras el valle de Grandvalira dormía en las bordes, él ya había medido la densidad del manto con la sonda y clavado las estacas de peligro.',
      'Cuatro inviernos encadenando el frío del Pirineo con los ventarrones de la Patagonia. Sus amigos de la infancia pagaban hipotecas en Encamp, elegían azulejos y cenaban en pareja cada viernes. A veces sentía el impulso de soltar los amarres, buscar alguien con quien compartir el desayuno y quedarse a ver la hierba crecer. Pero luego contemplaba sus tres pares de tablas de freeride, sus pasaportes sellados y la memoria intacta de mil amaneceres helados.',
      'Al cerrar la última pista, cuando los faros de las pisanieves comenzaban a peinar la ladera, ajustó las hebillas de las botas con dos golpes secos. Deslizarse en soledad sobre la nieve fresca le devolví esa pasión feroz por la que elegía no echar raíces.'
    ],
    bodyEN: [
      'The roar of avalanche dynamite echoed off the north face before dawn touched the slate rooftops. Marc adjusted his radio harness and waited for the snow plume to settle down the gully. Four consecutive years without experiencing summer leave a crust on the skin and weather lines around the eyes. While the Grandvalira valley slept, he had already measured snowpack density and hammered in danger stakes.',
      'Four winters linking Pyrenean frost with Patagonian gales. His childhood friends paid mortgages in Encamp, picked out kitchen tiles, and dined out every Friday. At times he felt the impulse to cast off his moorings, find someone to share breakfast with, and watch the grass grow. But then he glanced at his three pairs of freeride skis, stamped passports, and the unblemished memory of a thousand icy dawns.',
      'Closing the final trail as groomer headlights began combing the slopes, he snapped his boot buckles tight. Carving solo through fresh powder restored that fierce passion for which he chose never to take root.'
    ]
  },
  {
    id: 'venezuela',
    countryES: 'Venezuela',
    countryEN: 'Venezuela',
    flag: '🇻🇪',
    titleES: 'Respuesta silente',
    titleEN: 'Silent Reply',
    bodyES: [
      'Mientras le echaba la manea a la tuerta en el corral, le repetí la primera frase a los cuernos de la vaca. Sonó falsa. Llevaba tres semanas midiendo las palabras en la mente, limpiándolas como se limpia la hoja del machete, pero con las manos metidas en el balde de leche tibia el coraje se me escurría entre los dedos. El viejo Don Ruperto no era hombre de rodeos. Quería sonar como un hombre que ya tiene cuatro novillas preñadas y dos hectáreas tumbadas a fuerza de hacha.',
      'Me lavé el cuerpo en el caño con jabón azul para quitarme el olor a boñiga y a suero agrio. Me puse la camisa blanca de botones, la que guardaba para las fiestas de la Virgen, y me peiné el copete frente al espejo roto del galpón. Carmen me había dicho por la talanquera el domingo que su papá tomaría el café a las cinco en el corredor. Llegué a las cuatro y cincuenta.',
      'El viejo meció la silla de mimbre antes de voltear a mirarme. Carmen salió con la cafetera de ágata y dos tazas de peltre; no me miró a la cara, pero al dejar la taza sobre la mesa me rozó el hombro con la falda y ese aliento de pino limpio me devolvió la garganta. Solo pude decirle que yo trabajaba de lunes a lunes, que la tierra no se me moría en las manos y que quería pedirle permiso para hablarle formal a su hija. Don Ruperto sopló el vapor caliente, se levantó despacio y me dijo que mañana a las cinco salíamos a arreglar el alambrado.'
    ],
    bodyEN: [
      'While hobbling the milk cow in the pen, I rehearsed my opening line to the horns. It sounded hollow. I had spent three weeks trimming words in my head like sharpening a machete blade, but with my hands submerged in warm milk, courage slipped through my fingers. Old Don Ruperto was not a man for small talk. I wanted to sound like a man who owned four pregnant heifers and cleared two acres with an axe.',
      'I washed in the stream with blue soap to scrub off the farm dust. I put on my clean white button-up shirt reserved for feast days, and combed my hair in front of the cracked shed mirror. Carmen had whispered through the gate fence that her father took his coffee on the porch at five. I arrived at four-fifty.',
      'The old man rocked his wicker chair before turning around. Carmen stepped out carrying the coffee pot and two tin cups; she didn’t meet my eyes, but as she set the cup down, her skirt brushed my shoulder and that scent of fresh pine restored my voice. I told him straight that I worked Monday to Monday, that land didn’t wither in my hands, and that I sought permission to court his daughter formally. Don Ruperto blew on his steaming coffee, stood up slowly, and told me to be ready tomorrow at five to mend the boundary wire.'
    ]
  },
  {
    id: 'rusia',
    countryES: 'Rusia',
    countryEN: 'Russia',
    flag: '🇷🇺',
    titleES: 'Donde nada se pudre',
    titleEN: 'Where Nothing Rots',
    bodyES: [
      'El río ruge bajo la madera antes de que amanezca. A cuarenta y ocho grados bajo cero, la inacción congela una cabaña en tres horas. Stepan aviva la burzhuika con astillas de alerce y alimenta al fuego con una miga de pan para Baianai, el espíritu del cauce. Fiel al rito de cada amanecer, vierte un chorro de vodka en la infusión caliente de chaga y deja que el ardor le llene el pecho.',
      'Su hija le insistió el invierno pasado para que se fuera a un departamento de dos cuartos en Yakutsk, pero a Stepan le sobran razones para quedarse. Para cualquiera en la ciudad, su vida aquí parece un castigo; para él, en cambio, es la única abundancia real. Tiene el fuego de su estufa, el crujido de los árboles y prefiere la dignidad del frío antes que ahogarse en el aire sofocante de un bloque de concreto.',
      'En el lednik, la cueva subterránea cavada a mano hace treinta años, acomoda el pez helado junto a la muñeca de trapo que su nieta Masha olvidó al marcharse. La ciudad promete dinero y prisa, pero allá las cosas se rompen y se olvidan. Aquí abajo, la carne no se pudre y los recuerdos tampoco.'
    ],
    bodyEN: [
      'The river groans beneath the timber before dawn. At forty-eight degrees below zero, inactivity freezes a cabin in three hours. Stepan stokes the woodstove with larch splinters and feeds a breadcrumb to Baianai, spirit of the riverbed. True to his morning ritual, he pours a splash of vodka into hot chaga tea and lets the warmth fill his chest.',
      'His daughter urged him last winter to move into a two-room apartment in Yakutsk, but Stepan has plenty of reasons to stay. To city folk, his life here seems a sentence; to him, it is the only true abundance. He has his stove, the crackle of timber, and prefers the cold’s dignity over suffocating inside a concrete tower radiator.',
      'In the lednik, the hand-carved ice cellar dug thirty years ago, he rests the frozen fish beside the rag doll his granddaughter Masha left behind. The city promises money and rush, but there things break and fade. Down here, meat does not rot, and neither do memories.'
    ]
  },
  {
    id: 'finlandia',
    countryES: 'Finlandia',
    countryEN: 'Finland',
    flag: '🇫🇮',
    titleES: 'Una herida invisible',
    titleEN: 'An Invisible Wound',
    bodyES: [
      'Abrir los ojos hoy fue un accidente; la almohada ya estaba húmeda antes de que mi mente procesara que el día había empezado. No había ocurrido nada malo. Nadie había muerto, mi contrato de revisión editorial seguía activo y mi hermana me había enviado un mensaje anoche preguntando si necesitaba víveres. Sin embargo, el dolor estaba ahí, denso y gris como la luz del kaamos que se colaba entre las persianas de mi apartamento en Töölö.',
      'Tragué la pequeña pastilla blanca de sertralina con un buche de agua tibia, sabiendo que no era un hechizo mágico sino una prótesis química para evitar que el pozo fuera infinito. El monitor del escritorio parpadeaba a lo lejos con tres archivos adjuntos sin abrir. En una ciudad que la prensa global califica como el paraíso del bienestar, sentirse roto sin tener una herida visible genera una vergüenza sorda.',
      'Me quedé inmóvil observando el techo, escuchando el paso lejano del tranvía sobre los rieles congelados. No responder el teléfono no era desinterés, sino la incapacidad de fingir. Al atardecer, entendí que haber resistido el yugo de veinticuatro horas sin rendirme era, por hoy, mi única victoria secreta.'
    ],
    bodyEN: [
      'Opening my eyes today felt like an accident; the pillow was already damp before my mind registered that morning had arrived. Nothing tragic had happened. No one had passed away, my editorial review contract remained active, and my sister had texted asking if I needed groceries. Yet the ache was there, heavy and gray like the kaamos light seeping through the blinds of my Töölö apartment.',
      'I swallowed the small white sertraline pill with a gulp of lukewarm water, knowing it was no magic cure but a chemical crutch to prevent the abyss from growing endless. The desk monitor blinked in the distance with unread attachments. In a city global media ranks as the capital of happiness, feeling broken without a visible wound yields a quiet shame.',
      'I lay motionless staring at the ceiling, listening to the faint rumble of the tram over frozen rails. Leaving the phone unanswered wasn’t apathy, but the inability to pretend. By dusk, I realized that surviving the weight of twenty-four hours without surrendering was, for today, my only secret victory.'
    ]
  }
];

interface ExcerptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ES' | 'EN';
}

export const ExcerptModal: React.FC<ExcerptModalProps> = ({ isOpen, onClose, lang }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  const current = SAMPLE_STORIES[selectedIndex];

  const handleRandomize = () => {
    let next = Math.floor(Math.random() * SAMPLE_STORIES.length);
    if (next === selectedIndex) {
      next = (selectedIndex + 1) % SAMPLE_STORIES.length;
    }
    setSelectedIndex(next);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0d121f] border border-amber-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl text-slate-100 font-sans scrollbar-thin scrollbar-thumb-amber-500/20"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="space-y-6">
            {/* Header & Country Selector Pills */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <span className="mono-label !text-amber-400 text-xs">
                      {lang === 'ES' ? 'MUESTRAS DEL RELATO // 196 CULTURAS' : 'STORY SAMPLES // 196 CULTURES'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {current.flag} {lang === 'ES' ? current.countryES : current.countryEN}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleRandomize}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Shuffle size={14} />
                  <span>{lang === 'ES' ? 'OTRO RELATO' : 'SHUFFLE STORY'}</span>
                </button>
              </div>

              {/* 7 Specific Country Selector Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {SAMPLE_STORIES.map((story, idx) => (
                  <button
                    key={story.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                      idx === selectedIndex
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <span>{story.flag}</span>
                    <span>{lang === 'ES' ? story.countryES : story.countryEN}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Story Content with Animated Transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                    {lang === 'ES' ? current.titleES : current.titleEN}
                  </h4>
                </div>

                {/* Full Story Paragraphs */}
                <div className="space-y-4 text-sm sm:text-base text-slate-200 leading-relaxed font-sans pt-1">
                  {(lang === 'ES' ? current.bodyES : current.bodyEN).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Modal Footer */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Globe2 size={14} className="text-amber-400" />
                <span>196 {lang === 'ES' ? 'CULTURAS EN EL ATLAS' : 'CULTURES IN THE ATLAS'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRandomize}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center gap-2 transition-all"
                >
                  <Shuffle size={14} className="text-amber-400" />
                  {lang === 'ES' ? 'VER OTRO' : 'NEXT STORY'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  {lang === 'ES' ? 'CERRAR VISTA PREVIA' : 'CLOSE PREVIEW'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
