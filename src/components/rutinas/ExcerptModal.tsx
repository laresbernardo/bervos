import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, Shuffle } from 'lucide-react';

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
    id: 'nepal',
    countryES: 'Nepal',
    countryEN: 'Nepal',
    flag: '🇳🇵',
    titleES: 'La medida del mundo',
    titleEN: 'The Measure of the World',
    bodyES: [
      'Arpan mide dos metros con ocho centímetros y vive en una casa Newar de tres niveles en Patan donde los dinteles de madera labrada, llamados *dhyakhah*, miden apenas metro y medio.',
      'Su primer movimiento de la mañana es un doblez de cintura a noventa grados frente al lavamanos, una maniobra que sus lumbares registran con un tirón familiar. Para mirarse en el espejo del pasillo debe doblar las rodillas hasta alinearse con el marco, comprobando su barba mientras el cristal solo le devuelve el reflejo de sus clavículas. Antes de salir, se calza los zapatos de cuero de dos tonos que él mismo tuvo que confeccionar al no hallar su talla en todo el valle.',
      'Para subir al *tempo* eléctrico que lo lleva a la plaza principal, Arpan debe encajar sus fémures en diagonal, apretando las rodillas contra el asiento delantero mientras su cráneo roza la lona del techo. En los pasajes estrechos, bajo la garúa del monzón, la multitud avanza bajo paraguas cuyos picos metálicos apuntan exactamente a la altura de sus ojos. Arpan camina con el cuello inclinado hacia atrás para esquivar las varillas como quien esquiva lanzas en una procesión.',
      'En el santuario, sin embargo, su cuerpo es un privilegio: restaura las vigas de madera de *saal* en los aleros superiores sin necesidad de armar andamios de bambú, alcanzando los grabados con la soltura de una torre viviente. A mitad de la tarde, al detenerse a beber *chiya* en un puesto callejero, se acomoda en un taburete de plástico de veinte centímetros al ras del suelo, quedando con las rodillas a la altura del pecho mientras bebe con calma entre las miradas curiosas del vecindario.',
      'Al regresar al hogar, agacha la cabeza tres veces consecutivas para atravesar los portales de la entrada. El mundo entero le exige encogerse, pero al tenderse en diagonal sobre el colchón para que las pantorrillas no cuelguen en el vacío, Arpan reconquista su propia escala.'
    ],
    bodyEN: [
      'Arpan stands two meters and eight centimeters tall, living in a three-story Newar home in Patan where the carved wooden lintels, known as *dhyakhah*, reach barely a meter and a half.',
      'His first morning motion is a ninety-degree bend at the waist over the sink—a maneuver his lower back registers with a familiar pull. To check his beard in the hallway mirror, he must drop his knees until aligning with the frame, as the glass otherwise reflects only his collarbones. Before stepping out, he laces up two-toned leather shoes he crafted himself after finding no fitting size in the entire valley.',
      'To board the electric *tempo* taking him to the main square, Arpan wedges his thighs diagonally, pressing his knees against the front seat while his skull brushes the canvas roof. In narrow alleyways under monsoon drizzle, crowds move beneath umbrellas whose metallic tips aim precisely at his eye level. Arpan walks with his neck tilted back, ducking spoke points like dodging spears in a procession.',
      'Inside the shrine, however, his height becomes a blessing: he restores the *saal* wood beams along upper eaves without erecting bamboo scaffolding, reaching carvings with the ease of a living tower. Stopping for spiced *chiya* at a roadside stall, he settles onto a twenty-centimeter plastic stool near the pavement, knees drawn up to his chest, sipping calmly amid curious glances from passersby.',
      'Returning home, he bows his head three consecutive times through the doorway portals. The entire world demands he shrink, but stretching diagonally across his mattress so his legs don\'t hang in the void, Arpan reclaims his own scale.'
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
      'El cristal reflejó su rostro antes de que sus pies tocaran el suelo. A las seis de la mañana, Tolu ya había desbloqueado la pantalla dos veces: para apagar la alarma y para comprobar si el contador de interacciones subió mientras dormía.',
      'En la parada del *danfo* amarillo, entre el humo del escape, la encendió cuatro veces más. No era una obsesión; para él equivalía a mirar la hora o ajustarse la camisa. En la pantalla aparecía Khaby Lame, el creador senegalés que conquistó al mundo sin decir una sola palabra, limitándose a extender las palmas con sencillez ante trucos absurdos. Si un joven del continente podía conectar con millones desde un cuarto austero usando solo la mímica, él también podía dominar el *hyper-loop challenge*, la nueva secuencia viral de tres segundos donde los parpadeos y giros del rostro debían calzar con el ritmo exacto de la música.',
      'Entre el vapor del aceite donde freían *puff-puff* a la salida del instituto y el sopor de las aulas, el contador invisible que solo la voz narrativa registraba marcaba ya doscientas revisiones. El pulgar deslizaba la pantalla en cada pausa: al cruzar la calle o al esperar un cambio de semáforo. Un mensaje de su compañero de banco sobre la guía de matemáticas quedó soterrado bajo ochenta notificaciones de perfiles sin rostro que dejaban iconos de fuego en su último video. Tolu no respondió; los mensajes personales exigían palabras y explicaciones, mientras que la barra de notificaciones le regalaba una dosis limpia de aprobación sin pedir nada a cambio.',
      'Al terminar el día, Tolu había acumulado quinientas ochenta y cinco miradas a la pantalla, sin llevar la cuenta ni ser consciente de la cifra. Cenando *suya* sobre papel de periódico, sujetó el teléfono para ajustar su decimoquinta toma. Copió la postura firme de su ídolo, miró a la lente y extendió las manos como si la solución a todo fuera evidente.',
      'A las once, encendió el cristal una vez más para revisar sus métricas una vez mas antes de dormir. En el brillo azulado del display, sintió que el planeta entero lo miraba, sin notar la soledad del cuarto donde nadie decía su nombre.'
    ],
    bodyEN: [
      'The glass reflected his face before his feet touched the floor. At six in the morning, Tolu had already unlocked the screen twice: to turn off the alarm and to check if the engagement counter went up while he slept.',
      'At the yellow *danfo* bus stop, amid exhaust smoke, he illuminated it four more times. It wasn\'t an obsession; to him it was equivalent to checking the time or adjusting his shirt. Khaby Lame appeared on the screen, the Senegalese creator who conquered the world without saying a word, simply extending his palms with simplicity before absurd hacks. If a young man from the continent could connect with millions from an austere room using only mimicry, he could also master the *hyper-loop challenge*, the new three-second viral trend where blinks and facial turns had to lock with the exact rhythm of the music.',
      'Between the steam of oil frying *puff-puff* outside the school and the daze of the classrooms, the invisible counter logged two hundred reviews before noon. His thumb swiped the glass at every pause: crossing the street or waiting for a traffic light. A message from his desk mate about the math guide sank beneath eighty notifications from faceless profiles dropping fire icons on his latest video. Tolu didn\'t reply; personal messages demanded explanations, whereas the notification bar delivered a clean hit of approval without asking for anything in return.',
      'By sunset, Tolu had accumulated five hundred and eighty-five glances at the screen, unaware of the total. Eating *suya* off newspaper sheets, he held up his phone to frame his fifteenth take. He copied his idol\'s firm posture, looked into the lens, and extended his hands as if the solution to everything were obvious.',
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
      'Desde que instaló su sillón de hierro *Koken* de mil nueve cincuenta y cuatro en el *zaguán* más fresco de la calle Villegas, a tres cuadras del puerto, Lazarito se convirtió en el corazón del barrio. Aunque no emite una sola vocal desde niño, no existe persona más conversadora ni de mejor humor. Su idioma no necesita cuerdas vocales: dos toques de nudillos en el reposabrazos significan "pasa", una palmadita suave en la mejilla anuncia que la barba quedó limpia, y el repiqueteo de sus tijeras al aire marca el compás para que el cliente incline la nuca sin que él deba pedirlo.',
      'A las ocho de la mañana, tras desinfectar la navaja y frotar el cuero del *asentador* con polvo de talco, recibe el *cafecito* humeante que la vecina de al lado le pasa por la reja. A cambio, Lazarito le regala un guiño cómplice y un giro de tijera entre los dedos. Por su sillón pasa el chofer de *almendrón* agobiado por el carburador, y la trulla de Don Humberto con sus dos niños traviesos que pelean por el turno hasta que Lazarito los calma con un cómico conteo de tres dedos. Sentarse allí es como entrar a un confesionario alegre: todos desahogan sus penas y salen a la calle más livianos, sin pelos en la nuca y sin peso en el pecho, sabiendo que el barbero los escucha con una sonrisa franca que jamás interrumpirá para hablar de sí mismo.',
      'Para refrescar los cuellos irritados por el calor tropical, prepara su propia loción secreta macerando hojas de limonaria y romero en botellas recicladas de ron. Aplica la mezcla golpeando suavemente con la palma abierta sobre la piel, sacudiendo la capa con una reverencia teatral que saca las risas del cliente. Lazarito es el único hombre de la ciudad que conoce los secretos, deudas y amores clandestinos de tres manzanas a la redonda, guardándolos bajo llave tras sus ojos risueños.',
      'Al caer la tarde, limpia los pelajes del suelo con un cepillo de cerdas de pita y ordena las toallas limpias sobre la repisa. Antes de cerrar las rejas del *zaguán*, se seca el sudor del cuello, le guiña el ojo a su propio reflejo en el espejo gastado y regala una última sonrisa al pasaje que se llena de música nocturna.'
    ],
    bodyEN: [
      'Since installing his 1954 *Koken* iron barber chair in the coolest *zaguán* breezeway on Villegas Street, three blocks from Havana harbor, Lazarito became the heartbeat of the neighborhood. Though he hasn’t uttered a vowel since childhood, there is no more conversational or cheerful soul in the city. His language needs no vocal cords: two knuckle taps on the armrest mean "step right in," a soft pat on the cheek signals a clean shave, and the rhythmic snap of his scissors in the air sets the tempo.',
      'At eight in the morning, after sanitizing the razor and rubbing the leather strap with talcum powder, he receives the steaming *cafecito* handed through the iron gate by his neighbor. In return, Lazarito winks complicitly and spins his scissors between his fingers. Through his chair passes the classic *almendrón* car driver burdened by a failing carburetor, and Don Humberto’s lively grandchildren. Sitting there is like entering a joyful confessional: everyone pours out their troubles and steps back onto the street lighter, neatly trimmed and relieved of weight, knowing the barber listened with a genuine smile that will never interrupt to talk about himself.',
      'To soothe tropical heat-irritated necks, he formulates his own secret lotion by steeping lemongrass and rosemary leaves in recycled rum bottles. He applies the mixture by gently tapping his open palm against the skin, shaking out the cape with a theatrical bow that draws laughs from his client. Lazarito is the only man in the city who holds the secrets, debts, and clandestine romances of three blocks around, locking them safely behind his cheerful eyes.',
      'As dusk falls, he sweeps up hair trimmings with a palm-fiber brush and aligns clean towels on the rack. Before locking the iron gates of the *zaguán*, he wipes sweat from his neck, winks at his reflection in the worn mirror, and gifts one last smile to the alleyway filling with evening music.'
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
      'El estruendo de la dinamita retumbó en la cara norte antes de que el sol iluminara los tejados de pizarra. Marc ajustó la emisora al arnés y esperó a que la nube de nieve se asentara en la canal. Cuatro años sin probar el verano dejan una costra en la piel y arrugas fijas alrededor de los ojos. Mientras el valle de Grandvalira dormía en las *bordes*, él ya había medido la densidad del manto con la sonda y clavado las estacas de peligro.',
      'El viento trajo eventualmente el murmullo en catalán de los esquiadores. En la garita de socorro, sobre una mesa manchada de cera, descansaba su mochila con las correas desgastadas. En un mes volaría de nuevo a Bariloche. Cuatro inviernos encadenando el frío del Pirineo con los ventarrones de la Patagonia. Sus amigos de la infancia pagaban hipotecas en Encamp, elegían azulejos y cenaban en pareja cada viernes. A veces sentía el impulso de soltar los amarres, buscar alguien con quien compartir el desayuno y quedarse a ver la hierba crecer. Pero luego contemplaba sus tres pares de tablas de *freeride*, sus pasaportes sellados y la memoria intacta de mil amaneceres helados.',
      'Al cerrar la última pista, cuando los faros de las pisanieves comenzaban a peinar la ladera, ajustó las hebillas de las botas con dos golpes secos. Deslizarse en soledad sobre la nieve fresca le devolvía esa pasión feroz por la que elegía no echar raíces. Sin embargo, en el aparcamiento desierto, el crujido de sus pasos sobre el hielo le suenan hueco. Miró otra vez la ecografía en la pantalla y guardó el teléfono en el anorak, consciente de que en pocas semanas volvería a ser un extranjero en otra cordillera.'
    ],
    bodyEN: [
      'The roar of avalanche dynamite echoed off the north face before dawn touched the slate rooftops. Marc adjusted his radio harness and waited for the snow plume to settle down the gully. Four consecutive years without experiencing summer leave a crust on the skin and weather lines around the eyes. While the Grandvalira valley slept in traditional *bordes*, he had already measured snowpack density and hammered in danger stakes.',
      'The wind eventually brought the chatter of skiers in Catalan. Inside the rescue hut, upon a wax-stained table, rested his worn backpack. In a month he would fly to Bariloche again. Four winters linking Pyrenean frost with Patagonian gales. His childhood friends paid mortgages in Encamp, picked out kitchen tiles, and dined out every Friday. At times he felt the impulse to cast off his moorings, find someone to share breakfast with, and watch the grass grow. But then he glanced at his three pairs of *freeride* skis, stamped passports, and the unblemished memory of a thousand icy dawns.',
      'Closing the final trail as groomer headlights began combing the slopes, he snapped his boot buckles tight. Carving solo through fresh powder restored that fierce passion for which he chose never to take root. Yet in the deserted parking lot, the crunch of his steps over ice sounded hollow. He looked at the ultrasound photo on his screen once more and tucked his phone into his anorak, aware that in a few weeks he would be a foreigner on another mountain range once again.'
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
      'Mientras le echaba la *manea* a la tuerta en el corral, le repetí la primera frase a los cuernos de la vaca. Sonó falsa. Llevaba tres semanas midiendo las palabras en la mente, limpiándolas como se limpia la hoja del machete, pero con las manos metidas en el balde de leche tibia el coraje se me escurría entre los dedos. El viejo Don Ruperto no era hombre de rodeos. Si uno tropezaba al saludar, él daba la espalda y se iba a revisar los bebederos. A las diez, prensando el queso de *cincho* bajo el alero de palma, el suero me chorreaba por los codos mientras ensayaba la voz de pecho. Quería sonar como un hombre que ya tiene cuatro novillas preñadas y dos hectáreas tumbadas a fuerza de hacha, no como el muchacho que temblaba cada vez que Carmen salía al corredor a tender las sábanas.',
      'El resol de las dos me agarró cepillando al *zaino*. El calor en la sabana te seca hasta la saliva, pero yo sentía el pecho mojado por dentro. Me lavé el cuerpo en el *caño* con jabón azul para quitarme el olor a boñiga y a suero agrio. Me puse la camisa blanca de botones, la que guardaba para los funerales y las fiestas de la Virgen, y me peiné el copete frente al espejo roto del galpón. Carmen me había dicho por la *talanquera* el domingo que su papá tomaría el café a las cinco en el corredor. Llegué a las cuatro y cincuenta. Amarré al caballo en el *guamacho* de la entrada y caminé despacio, sintiendo las alpargatas de suela dura apretarme los talones.',
      'El viejo meció la silla de mimbre antes de voltear a mirarme. Las chicharras tapaban el ruido del viento en los pastos. Me ofreció el banco de madera de un manotazo seco, sin decir palabra. Carmen salió con la cafetera de ágata y dos tazas de peltre; no me miró a la cara, pero al dejar la taza sobre la mesa me rozó el hombro con la falda y ese aliento de pino limpio me devolvió la garganta. El viejo esperó a que el humo del *guayoyo* dejara de subir para levantar los ojos. Todo el discurso que le había dicho a las vacas se me desbarató en el buche. Solo pude decirle que yo trabajaba de lunes a lunes, que la tierra no se me moría en las manos y que quería pedirle permiso para hablarle formal a su hija. Don Ruperto ni pestañó. Miró el fondo de su taza, tomó un sorbo largo y luego miró hacia el potrero, donde las garzas se asentaban en el barreal. Sopló el vapor caliente, se levantó despacio y me dijo que mañana a las cinco salíamos a arreglar el alambrado.'
    ],
    bodyEN: [
      'While hobbling the cow in the pen, I rehearsed my opening line to her horns. It sounded hollow. I had spent three weeks trimming words in my head like sharpening a machete blade, but with my hands submerged in warm milk, courage slipped through my fingers. Old Don Ruperto was not a man for small talk. If you stumbled during a greeting, he would turn his back and inspect the water troughs. At ten, pressing *cincho* cheese under the palm eaves, whey trickled down my elbows while I rehearsed my deep voice. I wanted to sound like a man who owned four pregnant heifers and cleared two acres with an axe, not like the boy who trembled whenever Carmen stepped onto the porch to hang bedsheets.',
      'The two o\'clock heat caught me brushing the chestnut horse. Prairie sun dries even your saliva, but inside I felt soaked. I washed in the stream with blue soap to scrub off the dung and sour whey smell. I put on my clean white button-up shirt reserved for funerals and feast days, and combed my hair before the cracked shed mirror. Carmen had whispered through the gate fence that her father took coffee on the porch at five. I arrived at four-fifty. I tied the horse to the entry tree and walked slowly, feeling stiff leather sandals pinch my heels.',
      'The old man rocked his wicker chair before turning. Cicadas drowned out the wind in the grass. He gestured toward a wooden stool without a word. Carmen brought the enamel coffee pot and two tin cups; she didn’t meet my eyes, but as she set the cup down, her skirt brushed my shoulder and that scent of fresh pine restored my voice. The old man waited for the *guayoyo* coffee steam to settle before looking up. My whole speech crumbled in my throat. I told him straight that I worked Monday to Monday, that land didn’t die in my hands, and that I sought permission to court his daughter formally. Don Ruperto didn’t blink. He took a long sip, looked toward the pasture, blew on the hot steam, stood up slowly, and told me to be ready tomorrow at five to mend the boundary fence.'
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
      'Abrir los ojos hoy fue un accidente; la almohada ya estaba húmeda antes de que mi mente procesara que el día había empezado. No había ocurrido nada malo. Nadie había muerto, mi contrato de revisión editorial seguía activo y mi hermana me había enviado un mensaje anoche preguntando si necesitaba víveres. Sin embargo, el dolor estaba ahí, denso y gris como la luz del *kaamos* que se colaba entre las persianas de mi apartamento en Töölö. ¿Cómo se le explica a la gente que la tristeza no siempre es un luto, sino una falla en la química que vuelve el aire tan pesado como el plomo?',
      'Estiré el brazo con una lentitud de anciano para alcanzar el blíster gris sobre la mesa de noche. Tragué la pequeña pastilla blanca de sertralina con un buche de agua tibia, sabiendo que no era un hechizo mágico sino una prótesis química para evitar que el pozo fuera infinito. El monitor del escritorio parpadeaba a lo lejos con tres archivos adjuntos sin abrir, pero la sola idea de sentarme a corregir sintaxis me provocaba náuseas de agotamiento. En una ciudad que la prensa global califica como el paraíso del bienestar, sentirse roto sin tener una herida visible genera una vergüenza sorda.',
      'Me quedé inmóvil observando el techo, escuchando el sonido casi inaudible de la calefacción y el paso lejano del tranvía sobre los rieles congelados. No responder el teléfono no era desinterés, sino la incapacidad de fingir que estaba bien frente a quienes me querían. Al atardecer, logré apoyar los pies sobre la madera fría del piso para cambiar mi vaso por uno limpio. No resolví nada, no avancé en el trabajo ni descubrí una gran verdad existencial, pero al volver a la cama y cerrar las cuencas ardientes de mis ojos, entendí que haber resistido el yugo de veinticuatro horas sin rendirme era, por hoy, mi única victoria secreta.'
    ],
    bodyEN: [
      'Opening my eyes today felt like an accident; the pillow was already damp before my mind registered that morning had arrived. Nothing tragic had happened. No one had passed away, my editorial review contract remained active, and my sister had texted asking if I needed groceries. Yet the ache was there, heavy and gray like the *kaamos* light seeping through the blinds of my Töölö apartment. How do you explain to people that sadness isn\'t always mourning, but a chemical flaw that turns air as heavy as lead?',
      'I reached out with the slowness of an old man for the gray blister pack on the nightstand. I swallowed the small white sertraline pill with a gulp of lukewarm water, knowing it was no magic cure but a chemical crutch to prevent the abyss from growing endless. The desk monitor blinked in the distance with three unread attachments, but the mere thought of sitting to edit syntax brought waves of exhaustion. In a city global media ranks as the capital of happiness, feeling broken without a visible wound yields a quiet shame.',
      'I lay motionless staring at the ceiling, listening to the barely audible hum of heating and the faint rumble of the tram over frozen rails. Leaving the phone unanswered wasn’t apathy, but the inability to pretend I was fine in front of those who loved me. At dusk, I managed to place my feet on the cold wooden floor to swap my glass for a clean one. I solved nothing, made no work progress, nor uncovered any grand existential truth, but returning to bed and closing my burning eyes, I understood that enduring the weight of twenty-four hours without surrendering was, for today, my only secret victory.'
    ]
  },
  {
    id: 'oman',
    countryES: 'Omán',
    countryEN: 'Oman',
    flag: '🇴🇲',
    titleES: 'Triple victoria',
    titleEN: 'Triple Victory',
    bodyES: [
      'Un parpadeo rojo en la pantalla del radar bastaba para detener el flujo del petróleo mundial. Aziza apoyó las palmas sobre la caoba helada de la sala de crisis, sintiendo el leve roce del hilo de plata de su *abaya* contra las muñecas. A quince millas de la costa, donde el canal se angosta hasta parecer una garganta de roca, dos buques cisterna de banderas rivales permanecían con las calderas apagadas, rodeados por tres fragatas en zafarrancho. Llevaba despierta desde las cuatro redactando la propuesta neutral en tres idiomas; si fallaba en una sola subordinada, el bloqueo militar sería irreversible antes del mediodía. En el bolsillo interior guardaba una lágrima dura de *luban* verde, la resina silvestre que solía palpar a ciegas para mantener el pulso sereno mientras el calor costero empezaba a golpear los ventanales blindados.',
      'Para cuando el sol del mediodía cayó a plomo sobre el puerto, los gritos en inglés y farsi cruzaban la mesa redonda como esquirlas. Los agregados militares apretaban los nudillos, incapaces de ceder un solo nudo de patrullaje sin perder el honor frente a sus cancillerías. Aziza no elevó la voz. Con un gesto imperceptible, ordenó servir el café ritual; la llegada de las pequeñas *finjan* humeantes con cardamomo impuso una tregua muta de tres minutos, dictada por la vieja etiqueta de la *hikma*. Nadie podía gritar sosteniendo una porcelana ardiente entre los dedos. En esa pausa helada entre dos mareas de rabia, deslizó a través de la madera el folio con la enmienda redactada a mano: una inspección técnica conjunta a cargo de observadores locales, expresada con una ambigüedad tan precisa que ambas potencias podían atribuirse la victoria.',
      'El destello verde de la alerta satelital confirmó a última hora el viraje de las fragatas mar adentro. Aziza recogió el acta firmada sin permitir que sus ojos traicionaran el alivio, devolvió la inclinación de cabeza a ambos embajadores con una cortesía impenetrable y atravesó el patio de moscas y salitre.',
      'En la quietud de su casa, con el aire acondicionado devolviéndole el aliento, se despojó del velo *sheila* y escuchó la respiración pausada de sus hijos dormidos en la planta alta. Sirvió un vaso de agua y dejó que la noche de la costa se tragara el peligro sin que nadie supiera jamás quién había salvado la paz.'
    ],
    bodyEN: [
      'A red blink on the radar screen was enough to halt global oil flow. Aziza rested her palms against the chilled mahogany of the crisis room table, feeling the soft brush of silver thread on her *abaya* cuffs. Fifteen miles off the coast, where the channel narrows to a rocky throat, two tanker ships from rival flags sat with doused boilers, surrounded by three frigates on battle readiness. She had been awake since four drafting a neutral compromise in three languages; missing a single clause meant military blockade before noon. In her inner pocket she kept a tear of green *luban* resin she touched blindly to keep her pulse calm as coastal heat beat against armored glass.',
      'By noon, harsh exchanges in English and Farsi flew across the conference table like shrapnel. Military attachés clenched their knuckles, unwilling to yield a single knot of patrol without losing face to their ministries. Aziza never raised her voice. With an imperceptible gesture, she ordered ritual coffee served; the arrival of steaming *finjan* cups with cardamom imposed a silent three-minute truce dictated by the ancient protocol of *hikma*. Nobody could shout while holding boiling porcelain between their fingers. In that cold pause between waves of rage, she slid across the table the handwritten amendment: a joint technical inspection by local observers, worded with ambiguity so precise both powers could claim victory.',
      'The green flash of a satellite alert at dusk confirmed the frigates turning back out to sea. Aziza gathered the signed protocol without letting her eyes betray relief, returned a subtle nod to both ambassadors with impenetrable courtesy, and walked out across the salt-dusted courtyard.',
      'In the quiet of her home, with the air conditioning restoring her breath, she shed her *sheila* veil and listened to the peaceful breathing of her children sleeping upstairs. She poured a glass of water and let the coastal night swallow the danger without anyone ever knowing who had saved the peace.'
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * SAMPLE_STORIES.length);
      setSelectedIndex(randomIndex);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedIndex]);

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
          ref={scrollRef}
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
                  <div>
                    <span className="mono-label !text-amber-400 text-xs">
                      {lang === 'ES' ? 'MUESTRAS DE RELATOS' : 'SAMPLE STORIES'}
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
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${idx === selectedIndex
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
                    <p
                      key={i}
                      dangerouslySetInnerHTML={{
                        __html: para.replace(/\*(.*?)\*/g, '<em class="italic text-amber-200/90">$1</em>')
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Modal Footer */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Globe2 size={14} className="text-amber-400" />
                <span>1/196 {lang === 'ES' ? 'RELATOS' : 'STORIES'}</span>
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
