// Course content. Exercise types:
//   mc     – multiple choice. quote = English line shown (with 🔊), say = audio-only prompt.
//   curve  – multiple choice over a before/after yield-curve chart.
//   match  – tap pairs (English ↔ Spanish).
//   build  – arrange word tiles. prompt = Spanish sentence, or say = audio to transcribe.
//   input  – typed answer. numeric answers are compared as numbers.
// `terms` are glossary ids; they join the review deck when the lesson is finished.

const MOVES = ['Bull steepener', 'Bear steepener', 'Bull flattener', 'Bear flattener'];
const START = [4.00, 4.05, 4.20, 4.45];
const TONE = ['Hawkish 🦅', 'Neutral', 'Dovish 🕊️'];

export const UNITS = [
  {
    id: 'u1', title: 'La curva', subtitle: 'Precio, rendimiento y cómo suena el mercado de bonos', color: 'green',
    lessons: [
      {
        id: 'u1l1', title: 'Precio y rendimiento', icon: '📉',
        ex: [
          { type: 'mc', prompt: 'Completa la frase:', quote: 'When bond prices go up, yields ___.', options: ['go down', 'go up', 'stay flat'], answer: 0, explain: 'Precio y rendimiento se mueven al revés: si pagas más por el mismo cupón, ganas menos en proporción.', terms: ['yield', 'bond'] },
          { type: 'match', pairs: [['yield', 'rendimiento'], ['coupon', 'cupón'], ['maturity', 'vencimiento'], ['par', 'la par (100)'], ['basis point', 'punto básico']], terms: ['yield', 'coupon', 'maturity', 'par', 'bp'] },
          { type: 'mc', prompt: '¿Qué pasó con los rendimientos?', quote: 'Treasuries rallied after the jobs report.', options: ['Bajaron', 'Subieron', 'No cambiaron'], answer: 0, explain: 'En bonos, «rally» = suben los precios → bajan los rendimientos.', terms: ['rally', 'treasuries', 'payrolls'] },
          { type: 'mc', prompt: 'El rendimiento estaba en 4.00 % y subió 25 basis points. ¿Nuevo rendimiento?', options: ['4.25 %', '4.025 %', '6.50 %', '29.00 %'], answer: 0, explain: '1 pb = 0.01 %, así que 25 pb = 0.25 %.', terms: ['bp'] },
          { type: 'build', prompt: 'Los Treasuries cayeron y los rendimientos subieron.', answer: ['Treasuries', 'sold off', 'and', 'yields', 'rose'], alts: [['Treasuries', 'fell', 'and', 'yields', 'rose']], extra: ['rallied', 'fell'], explain: '«Sell off» = venta masiva. Si caen los precios, suben los rendimientos.', terms: ['selloff'] },
          { type: 'mc', prompt: 'Escucha: ¿cuánto subió el rendimiento a 10 años?', say: 'The ten-year yield is up six basis points, at four point four one percent.', options: ['6 pb', '0.6 pb', '60 pb', '4.41 pb'], answer: 0, explain: 'Subió 6 pb y quedó en 4.41 %.', terms: ['bp', 'tens'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Bonds are well bid this morning.', options: ['Hay muchos compradores: los precios suben', 'Hay muchos vendedores: los precios bajan', 'Hoy hay subasta de bonos', 'Los bonos están baratos'], answer: 0, explain: '«Bid» = demanda. «Well bid» = mucha demanda.', terms: ['bid'] },
          { type: 'mc', prompt: 'Un bono tiene una duration de 7. Si los rendimientos suben 1 punto porcentual, su precio…', options: ['cae ~7 %', 'sube ~7 %', 'cae ~1 %', 'cae ~0.7 %'], answer: 0, explain: 'La duración mide la sensibilidad: 7 × 1 % ≈ 7 % de caída.', terms: ['duration'] },
        ],
      },
      {
        id: 'u1l2', title: 'Números al estilo Bloomberg', icon: '🔢',
        ex: [
          { type: 'input', prompt: 'Escucha y escribe el rendimiento del bono a 10 años (en %).', say: 'Tens are trading at four thirty-two.', numeric: true, answer: 4.32, explain: '«Four thirty-two» = 4.32 %. En TV casi nunca dicen «point».', terms: ['tens'] },
          { type: 'input', prompt: 'Escucha: ¿cuántos puntos básicos bajó el bono a 2 años?', say: 'Twos are down twelve bips on the day.', numeric: true, answer: 12, explain: '«Twelve bips» = 12 puntos básicos.', terms: ['twos', 'bp'] },
          { type: 'mc', prompt: '¿Qué quiere decir?', quote: 'The 10-year is back on a four handle.', options: ['El rendimiento volvió a estar entre 4.00 % y 4.99 %', 'El rendimiento subió 4 pb', 'El precio subió 4 puntos', 'El rendimiento está exactamente en 4.00 %'], answer: 0, explain: 'El «handle» es la parte entera del número.', terms: ['handle'] },
          { type: 'mc', prompt: '¿Cuánto se operó?', quote: 'We saw two yards of fives trade in the last hour.', options: ['2 mil millones de dólares en bonos a 5 años', '2 millones de dólares en bonos a 5 años', '5 mil millones en bonos a 2 años', '2 yardas de bonos'], answer: 0, explain: '«Yard» = mil millones (billion). En la mesa, «a buck» = 1 millón.', terms: ['yard', 'fives'] },
          { type: 'mc', prompt: 'Un Treasury cotiza a «99-16». ¿Cuánto es en decimales?', options: ['99.50', '99.16', '99.32', '91.60'], answer: 0, explain: 'Los Treasuries cotizan en 32avos: 16/32 = 0.50.', terms: ['ticks'] },
          { type: 'mc', prompt: '¿Y «99-16+»?', options: ['99.515625', '99.165', '99.50', '99.625'], answer: 0, explain: 'El «+» es medio 32avo (1/64): 99 + 16.5/32 = 99.515625.', terms: ['ticks'] },
          { type: 'build', prompt: 'Escucha y ordena lo que oyes.', say: 'Tens are up eight bips.', answer: ['Tens', 'are', 'up', 'eight', 'bips'], extra: ['down', 'twos'], terms: ['tens', 'bp'] },
          { type: 'input', prompt: 'Escucha: ¿en cuánto está el diferencial 2s10s (en pb)?', say: 'Twos-tens is at plus fifty-five.', numeric: true, answer: 55, explain: '«Twos-tens» = 2s10s: el 10 años rinde 55 pb más que el 2 años.', terms: ['2s10s'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The market has about fifty bips of cuts priced for this year.', options: ['El mercado espera recortes que suman 0.50 % este año', 'La Fed ya recortó 50 pb', 'El mercado espera 50 recortes', 'Los bonos bajaron 50 pb'], answer: 0, explain: '«Priced» = descontado por el mercado.', terms: ['pricedin', 'cut', 'bp'] },
        ],
      },
      {
        id: 'u1l3', title: 'Empinamiento y aplanamiento', icon: '📈',
        ex: [
          { type: 'mc', prompt: 'En la jerga de bonos, «bull» significa…', options: ['Suben los precios (bajan los rendimientos)', 'Suben los rendimientos', 'Suben las acciones', 'La curva se empina'], answer: 0, explain: '«Bull» y «bear» se refieren a los precios de los bonos, no a los rendimientos.' },
          { type: 'curve', prompt: '¿Qué movimiento de la curva es este?', before: START, after: [3.85, 3.93, 4.12, 4.40], options: MOVES, answer: 0, fixed: true, explain: 'Todo baja (bull) y el tramo corto baja más (−15 vs −5 pb): la curva se empina.', terms: ['bullsteep'] },
          { type: 'curve', prompt: '¿Y este?', before: START, after: [4.03, 4.12, 4.36, 4.66], options: MOVES, answer: 1, fixed: true, explain: 'Todo sube (bear) y el tramo largo sube más (+21 vs +3 pb).', terms: ['bearsteep'] },
          { type: 'curve', prompt: '¿Y este?', before: START, after: [4.18, 4.17, 4.26, 4.49], options: MOVES, answer: 3, fixed: true, explain: 'Todo sube (bear), pero el tramo corto sube más (+18 vs +4 pb): la curva se aplana.', terms: ['bearflat'] },
          { type: 'curve', prompt: '¿Y este?', before: START, after: [3.97, 3.94, 4.04, 4.27], options: MOVES, answer: 2, fixed: true, explain: 'Todo baja (bull) y el tramo largo baja más (−18 vs −3 pb).', terms: ['bullflat'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: '2s10s is at minus thirty.', options: ['La curva está invertida: el 2 años rinde más que el 10 años', 'El 10 años rinde 30 pb más que el 2 años', 'El 2 años bajó 30 pb', 'Hay 30 recortes descontados'], answer: 0, explain: 'Negativo = el tramo corto rinde más que el largo: curva invertida.', terms: ['2s10s', 'inverted'] },
          { type: 'mc', prompt: 'La Fed sugiere recortes antes de lo esperado. El 2 años baja 15 pb y el 10 años baja 5 pb. ¿Titular correcto?', options: ['The curve bull steepens', 'The curve bear flattens', 'The curve bear steepens', 'The curve bull flattens'], answer: 0, explain: 'Bajan los rendimientos (bull) y el corto baja más: se empina.', terms: ['bullsteep'] },
          { type: 'match', pairs: [['front end', 'tramo corto'], ['long end', 'tramo largo'], ['the belly', 'tramo medio (5–7 años)'], ['steepener', 'empinamiento'], ['flattener', 'aplanamiento']], terms: ['frontend', 'longend', 'belly', 'steepen', 'flatten'] },
          { type: 'build', prompt: 'La curva se empinó (en modo bajista) por temores fiscales.', answer: ['The', 'curve', 'bear', 'steepened', 'on', 'fiscal', 'worries'], extra: ['bull', 'flattened'], terms: ['bearsteep', 'deficit'] },
        ],
      },
      {
        id: 'u1l4', title: 'Repaso: Real Yield en vivo', icon: '📺',
        ex: [
          { type: 'mc', prompt: 'Escucha. ¿Qué pasó?', say: "It's been a brutal week for the long end. Thirties are up nineteen basis points, and the curve is steepening.", options: ['El rendimiento a 30 años subió 19 pb y la curva se empinó', 'El precio del bono a 30 años subió 19 %', 'El 2 años subió 19 pb y la curva se aplanó', 'Fue una semana tranquila'], answer: 0, terms: ['longend', 'thirties', 'steepen'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Real money has been buying the belly.', options: ['Inversionistas institucionales de largo plazo compran bonos de 5–7 años', 'Hedge funds venden bonos a 30 años', 'Los bancos centrales compran letras', 'Los inversionistas minoristas compran bonos'], answer: 0, terms: ['realmoney', 'belly'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The 20-year auction tailed by two basis points.', options: ['Demanda débil: se adjudicó 2 pb por encima de lo esperado', 'Demanda fuerte: se adjudicó 2 pb por debajo', 'La subasta se canceló', 'El Tesoro vendió 2 mil millones'], answer: 0, terms: ['auction', 'tail'] },
          { type: 'mc', prompt: '¿Por qué les gusta el bono a 5 años?', quote: 'We like the five-year for carry and roll-down.', options: ['Rinde por mantenerlo y gana al «bajar» por la curva con el tiempo', 'Esperan que suba su rendimiento', 'Tiene la mayor duración', 'Lo van a recomprar'], answer: 0, terms: ['carry', 'rolldown'] },
          { type: 'input', prompt: 'Completa con una palabra en inglés:', quote: 'Yields fall when bonds ___.', answer: ['rally', 'rallies'], explain: '«Rally» = suben los precios de los bonos y bajan los rendimientos.', terms: ['rally'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Term premium is making a comeback at the long end.', options: ['Los inversionistas vuelven a exigir más por prestar a largo plazo', 'La Fed vuelve a subir tasas', 'Los bonos largos están más caros', 'La curva se invierte'], answer: 0, terms: ['termpremium', 'longend'] },
          { type: 'build', prompt: 'Escucha y ordena lo que oyes.', say: 'The curve is bear steepening.', answer: ['The', 'curve', 'is', 'bear', 'steepening'], extra: ['bull', 'flattening'], terms: ['bearsteep'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'Bonds caught a bid after the weak data, and the curve bull flattened.', options: ['Subieron los precios, y los plazos largos bajaron más de rendimiento', 'Bajaron los precios y subieron los rendimientos cortos', 'Subieron los rendimientos largos', 'No hubo cambios'], answer: 0, terms: ['bid', 'bullflat'] },
        ],
      },
      {
        id: 'u1l5', title: 'Subastas del Tesoro', icon: '🏛️',
        ex: [
          { type: 'match', pairs: [['auction', 'subasta'], ['tail', 'cola (demanda débil)'], ['stop through', 'subasta fuerte'], ['bid-to-cover', 'ratio de cobertura'], ['primary dealers', 'operadores primarios']], terms: ['auction', 'tail', 'stopthrough', 'btc', 'dealers'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The 10-year auction stopped through by a basis point.', options: ['Demanda fuerte: se adjudicó 1 pb por debajo del rendimiento esperado', 'Demanda débil: se adjudicó 1 pb por encima', 'El Tesoro canceló la subasta', 'Los dealers se quedaron con todo'], answer: 0, terms: ['stopthrough', 'auction'] },
          { type: 'mc', prompt: 'El when-issued estaba en 4.52 % y la subasta se adjudicó a 4.55 %. ¿Qué pasó?', options: ['Tailed 3 bps: demanda débil', 'Stopped through 3 bps: demanda fuerte', 'Bid-to-cover de 3', 'Nada: es lo normal'], answer: 0, explain: 'Adjudicar por encima del when-issued = los inversionistas exigieron más rendimiento: la subasta «tails».', terms: ['wi', 'tail'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Indirect bidders took down 75% of the auction.', options: ['Postores indirectos (bancos centrales extranjeros, gestoras) se quedaron con el 75 %: buena demanda', 'Los dealers compraron el 75 %: mala demanda', 'Se rechazó el 75 % de las ofertas', 'La subasta fue 75 % más pequeña'], answer: 0, terms: ['indirects', 'takedown'] },
          { type: 'mc', prompt: '¿Es buena o mala señal?', quote: 'Dealers were left with 20% of the deal.', options: ['Mala: los operadores primarios absorbieron lo que nadie más quiso', 'Buena: los dealers tienen mucho apetito', 'Neutral: siempre se quedan con el 20 %', 'No tiene relación con la demanda'], answer: 0, explain: 'Los primary dealers deben pujar siempre; si terminan con mucho, faltaron otros compradores.', terms: ['dealers'] },
          { type: 'input', prompt: 'Escucha: ¿cuál fue el bid-to-cover?', say: 'The bid-to-cover came in at two point three eight.', numeric: true, answer: 2.38, terms: ['btc'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Treasury kept coupon auction sizes unchanged at the quarterly refunding.', options: ['En su anuncio trimestral, el Tesoro no cambió el tamaño de las subastas de bonos con cupón', 'El Tesoro devolvió dinero a los inversionistas', 'El Tesoro subió los cupones', 'El Tesoro canceló las subastas del trimestre'], answer: 0, terms: ['refunding', 'coupon'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Treasury is leaning on bills rather than terming out the debt.', options: ['Se financia más con letras cortas en vez de alargar el plazo con bonos', 'Está recomprando bonos largos', 'Está emitiendo más bonos a 30 años', 'Está pagando toda su deuda'], answer: 0, terms: ['tbill', 'termout'] },
          { type: 'build', prompt: 'La subasta tuvo una cola de dos puntos básicos.', answer: ['The', 'auction', 'tailed', 'by', 'two', 'basis', 'points'], extra: ['stopped', 'through'], terms: ['tail', 'auction'] },
        ],
      },
    ],
  },
  {
    id: 'u2', title: 'La Fed e inflación', subtitle: 'Halcones, palomas y lo que descuenta el mercado', color: 'blue',
    lessons: [
      {
        id: 'u2l1', title: 'Halcones y palomas', icon: '🦅',
        ex: [
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'We are prepared to raise rates further if inflation proves sticky.', options: TONE, answer: 0, fixed: true, explain: 'Hablar de subir tasas si la inflación persiste = halcón.', terms: ['hawkish', 'sticky', 'hike'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'With the labor market cooling, it will soon be appropriate to lower the policy rate.', options: TONE, answer: 2, fixed: true, explain: 'Bajar la tasa para apoyar el empleo = paloma.', terms: ['dovish', 'fedfunds'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'We will remain data-dependent and make decisions meeting by meeting.', options: TONE, answer: 1, fixed: true, explain: 'No se compromete con nada: neutral.', terms: ['datadep'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'There is still more wood to chop on inflation.', options: TONE, answer: 0, fixed: true, explain: '«More wood to chop» = todavía falta trabajo contra la inflación → halcón.', terms: ['wood', 'hawkish'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The market has three cuts priced in for next year.', options: ['El mercado ya descuenta tres recortes el próximo año', 'La Fed prometió tres recortes', 'Hubo tres recortes este año', 'Los precios bajaron tres veces'], answer: 0, terms: ['pricedin', 'cut'] },
          { type: 'match', pairs: [['hike', 'alza de tasas'], ['cut', 'recorte'], ['pause', 'pausa'], ['dot plot', 'gráfico de puntos'], ['terminal rate', 'tasa terminal']], terms: ['hike', 'cut', 'pause', 'dotplot', 'terminal'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The Chair pushed back against market pricing.', options: ['Dijo que el mercado espera algo distinto de lo que hará la Fed', 'Aceptó lo que descuenta el mercado', 'Anunció un recorte sorpresa', 'Renunció a su cargo'], answer: 0, terms: ['pushback', 'pricedin'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué descuenta el mercado?', say: 'Fed funds futures now price roughly a forty percent chance of a hike in December.', options: ['~40 % de probabilidad de un alza en diciembre', 'Un alza de 40 pb en diciembre', '40 % de probabilidad de un recorte', 'Una pausa segura en diciembre'], answer: 0, terms: ['fff', 'hike'] },
          { type: 'mc', prompt: '¿Qué significa esta frase tan repetida?', quote: 'Higher for longer.', options: ['Tasas altas por más tiempo del esperado', 'Rendimientos que suben cada vez más rápido', 'Inflación alta para siempre', 'Bonos más largos con más rendimiento'], answer: 0, terms: ['hfl'] },
        ],
      },
      {
        id: 'u2l2', title: 'Inflación y rendimientos reales', icon: '🔥',
        ex: [
          { type: 'match', pairs: [['CPI', 'IPC'], ['core', 'subyacente'], ['breakeven', 'inflación implícita'], ['real yield', 'rendimiento real'], ['sticky', 'persistente']], terms: ['cpi', 'core', 'breakeven', 'realyield', 'sticky'] },
          { type: 'mc', prompt: 'El 10 años nominal rinde 4.30 % y el TIPS a 10 años (real) 2.00 %. ¿Breakeven aproximado?', options: ['2.30 %', '6.30 %', '2.00 %', '0.43 %'], answer: 0, explain: 'Breakeven ≈ nominal − real = 4.30 − 2.00 = 2.30 %.', terms: ['breakeven', 'tips', 'realyield'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Core came in hot.', options: ['La inflación subyacente salió por encima de lo esperado', 'Hizo mucho calor', 'La inflación total bajó', 'El dato se retrasó'], answer: 0, terms: ['core', 'hot'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'A soft landing is now the consensus view.', options: ['La mayoría espera que baje la inflación sin recesión', 'La mayoría espera una recesión', 'Los bonos caerán suavemente', 'La Fed dejará de publicar datos'], answer: 0, terms: ['softlanding', 'consensus'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Services inflation remains sticky.', options: ['La inflación de servicios no baja fácilmente', 'La inflación de servicios cayó rápido', 'Los servicios están más baratos', 'No hay datos de servicios'], answer: 0, terms: ['sticky'] },
          { type: 'build', prompt: 'La inflación subyacente salió más baja de lo esperado.', answer: ['Core', 'came', 'in', 'softer', 'than', 'expected'], extra: ['hotter', 'higher'], terms: ['core', 'hot'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Breakevens widened after the oil spike.', options: ['Subieron las expectativas de inflación del mercado', 'Los rendimientos reales bajaron a cero', 'El petróleo bajó', 'Los bonos corporativos se abarataron'], answer: 0, terms: ['breakeven', 'widen'] },
          { type: 'mc', prompt: 'Si la inflación baja pero sigue siendo positiva, se llama…', options: ['disinflation', 'deflation', 'stagflation', 'reflation'], answer: 0, explain: 'Deflation = los precios caen. Disinflation = suben, pero cada vez menos.', terms: ['disinflation'] },
        ],
      },
      {
        id: 'u2l3', title: 'La conferencia de prensa', icon: '🎤',
        ex: [
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'We are in no hurry to cut rates.', options: TONE, answer: 0, fixed: true, explain: '«Sin prisa por recortar» = la Fed va a esperar: el mercado lo lee como halcón.', terms: ['nohurry', 'cut'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Policy is currently restrictive.', options: ['La tasa está por encima de la neutral y frena la economía', 'La Fed prohíbe los préstamos', 'La tasa está en cero', 'La Fed dejó de comprar bonos'], answer: 0, terms: ['restrictive', 'neutral'] },
          { type: 'match', pairs: [['dual mandate', 'mandato dual'], ['dissent', 'voto en contra'], ['statement', 'comunicado'], ['presser', 'conferencia de prensa'], ['SEP', 'proyecciones económicas']], terms: ['dualmandate', 'dissent', 'statement', 'presser', 'sep'] },
          { type: 'mc', prompt: 'El «dual mandate» de la Fed es…', options: ['Máximo empleo y estabilidad de precios', 'Controlar el dólar y la bolsa', 'Bajar la inflación y el déficit', 'Fijar tasas y comprar bonos'], answer: 0, terms: ['dualmandate'] },
          { type: 'mc', prompt: '¿Qué pasó en la votación?', quote: 'There were two dissents in favor of a larger cut.', options: ['Dos miembros votaron en contra porque querían un recorte más grande', 'Dos miembros querían subir tasas', 'Dos miembros renunciaron', 'La decisión fue unánime'], answer: 0, terms: ['dissent', 'cut'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'The balance of risks has shifted toward the employment side of our mandate.', options: TONE, answer: 2, fixed: true, explain: 'Si preocupa más el empleo que la inflación, se acercan los recortes: paloma.', terms: ['balancerisks', 'dualmandate'] },
          { type: 'mc', prompt: '¿Qué dice la Fed?', quote: 'The median dot in the SEP shows two cuts next year.', options: ['La mediana de las proyecciones de los miembros indica dos recortes el próximo año', 'La Fed ya decidió dos recortes', 'Solo dos miembros quieren recortar', 'El mercado descuenta dos recortes'], answer: 0, explain: 'Los «dots» son proyecciones, no promesas. Y lo que descuenta el mercado puede ser distinto.', terms: ['sep', 'dotplot'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué dijo el Chair?', say: "A hike is not our base case, but it isn't off the table either.", options: ['Un alza no es el escenario principal, pero no se descarta', 'Habrá un alza en la próxima reunión', 'Las alzas quedaron descartadas', 'Van a recortar tasas'], answer: 0, terms: ['basecase', 'offtable', 'hike'] },
          { type: 'build', prompt: 'No tenemos prisa por recortar.', answer: ['We', 'are', 'in', 'no', 'hurry', 'to', 'cut'], extra: ['hike', 'fast'], terms: ['nohurry'] },
        ],
      },
    ],
  },
  {
    id: 'u3', title: 'Bonos emergentes', subtitle: 'Moneda fuerte, emisiones y reestructuraciones', color: 'orange',
    lessons: [
      {
        id: 'u3l1', title: 'Moneda fuerte vs. local', icon: '🌎',
        ex: [
          { type: 'mc', prompt: 'Un bono del gobierno de Brasil emitido en reales es un bono…', options: ['local-currency', 'hard-currency', 'quasi-sovereign', 'investment grade corporate'], answer: 0, terms: ['localccy'] },
          { type: 'mc', prompt: 'Un bono de Colombia en dólares, bajo ley de Nueva York, es un…', options: ['hard-currency Eurobond', 'local-currency bond', 'T-bill', 'covered bond'], answer: 0, terms: ['hardccy', 'eurobond'] },
          { type: 'match', pairs: [['sovereign', 'soberano'], ['spread', 'diferencial sobre el Treasury'], ['EMBI', 'índice EM en dólares (JPM)'], ['GBI-EM', 'índice EM en moneda local (JPM)'], ['frontier', 'mercados frontera']], terms: ['sovereign', 'spread', 'embi', 'gbiem', 'frontier'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'EMBI spreads tightened twenty basis points this week.', options: ['Los bonos EM en dólares subieron de precio frente a los Treasuries', 'Los bonos EM perdieron valor', 'La Fed subió tasas 20 pb', 'Los países emitieron menos deuda'], answer: 0, explain: 'En crédito, «tighten» = el spread baja → el bono se valoriza.', terms: ['embi', 'spread', 'tightening'] },
          { type: 'mc', prompt: 'El Treasury a 10 años rinde 4.30 % y el spread del soberano es +350 pb. ¿Rendimiento aproximado?', options: ['7.80 %', '3.54 %', '4.65 %', '35.30 %'], answer: 0, explain: 'Rendimiento ≈ Treasury + spread = 4.30 % + 3.50 %.', terms: ['spread'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The carry trade is back in favor in Latin America.', options: ['Vuelve a ser popular financiarse barato para invertir en monedas con tasas altas', 'Los países de la región vuelven al FMI', 'Suben los spreads en la región', 'Los bancos centrales venden reservas'], answer: 0, terms: ['carrytrade'] },
          { type: 'mc', prompt: '¿Qué riesgo señala?', quote: 'Positioning is heavy among crossover investors.', options: ['Muchos inversionistas globales no especializados ya compraron y pueden salir rápido', 'Los inversionistas EM tienen poco riesgo', 'Hay pocas emisiones nuevas', 'Los bonos son ilíquidos'], answer: 0, terms: ['positioning', 'crossover'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué pasó?', say: 'High-yield sovereign spreads widened forty basis points on contagion fears.', options: ['Subió el riesgo percibido de los soberanos high yield por temor a contagio', 'Bajaron los spreads de los soberanos', 'Los soberanos pagaron sus bonos', 'Subió la calificación de los soberanos'], answer: 0, terms: ['hy', 'widen', 'contagion'] },
        ],
      },
      {
        id: 'u3l2', title: 'Una emisión nueva', icon: '🧾',
        ex: [
          { type: 'mc', prompt: '¿En qué orden ocurre una emisión?', options: ['IPTs → guidance → pricing', 'Pricing → IPTs → guidance', 'Guidance → pricing → IPTs', 'Pricing → guidance → IPTs'], answer: 0, explain: 'Guía inicial (IPTs) → guía revisada (guidance) → precio final (pricing).', terms: ['ipts', 'guidance', 'priced'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'IPTs are in the T+400 area.', options: ['Guía inicial: ~400 pb sobre el Treasury comparable', 'El bono paga 4 % de cupón', 'El bono vence en 400 días', 'Se venderán 400 millones'], answer: 0, terms: ['ipts'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Books are above $12 billion, more than four times covered.', options: ['Hay órdenes por más de 12 mil millones, más de 4 veces el monto', 'El país debe 12 mil millones', 'Se emitirán 4 bonos', 'El bono vence en 12 años'], answer: 0, terms: ['books', 'covered'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The deal priced at T+362.5, 37.5 basis points inside IPTs.', options: ['Se colocó con menos spread que la guía inicial: mucha demanda', 'Se colocó con más spread: poca demanda', 'Se canceló la emisión', 'El precio bajó 37.5 puntos'], answer: 0, terms: ['inside', 'priced'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Investors demanded a new issue concession of about fifteen basis points.', options: ['El bono nuevo paga ~15 pb más que los bonos existentes del emisor', 'El emisor recompra bonos con 15 % de descuento', 'Los bancos cobran 15 pb de comisión', 'El bono nuevo paga 15 pb menos'], answer: 0, terms: ['concession'] },
          { type: 'build', prompt: 'El soberano reabrió su bono 2035.', answer: ['The', 'sovereign', 'tapped', 'its', '2035', 'bond'], extra: ['priced', 'restructured'], terms: ['tap', 'sovereign'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The new bonds traded up two points on the break.', options: ['El precio subió 2 puntos al empezar a cotizar', 'El rendimiento subió 2 %', 'El bono se partió en dos', 'Se vendieron 2 bonos'], answer: 0, terms: ['onthebreak', 'point'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The sovereign may have left some money on the table.', options: ['Quizá pudo pagar un rendimiento más bajo (vender sus bonos más caros)', 'Olvidó cobrar una parte de la emisión', 'Regaló dinero a los bancos', 'Tiene reservas sin usar'], answer: 0, terms: ['moneytable'] },
        ],
      },
      {
        id: 'u3l3', title: 'Reestructuración', icon: '🩹',
        ex: [
          { type: 'match', pairs: [['haircut', 'quita'], ['holdout', 'acreedor que no acepta'], ['CACs', 'cláusulas de acción colectiva'], ['IMF', 'FMI'], ['default', 'impago']], terms: ['haircut', 'holdout', 'cacs', 'imf', 'default'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The bonds are trading at 45 cents on the dollar.', options: ['Valen 45 por cada 100 de nominal: el mercado espera una fuerte quita', 'Rinden 45 %', 'Pagan 45 centavos de cupón', 'Vencen en 45 días'], answer: 0, terms: ['cents', 'haircut'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'A staff-level agreement with the IMF would be a key catalyst for the bonds.', options: ['Un acuerdo técnico con el FMI podría impulsar los bonos', 'El FMI compraría los bonos', 'El FMI prohíbe comprar los bonos', 'El personal del FMI renuncia'], answer: 0, terms: ['sla', 'imf', 'catalyst'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Bondholders accepted a 30% nominal haircut.', options: ['Los acreedores aceptan perder 30 % del principal', 'Los bonos suben 30 %', 'El cupón baja 30 pb', 'Solo el 30 % de acreedores aceptó'], answer: 0, terms: ['haircut'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The government faces a maturity wall in 2027.', options: ['Vencen muchos bonos en 2027: hay riesgo de refinanciamiento', 'Construirá un muro en 2027', 'Sus bonos vencen después de 2027', 'Tiene prohibido emitir hasta 2027'], answer: 0, terms: ['maturitywall', 'refi'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The government is kicking the can down the road.', options: ['Está postergando el problema en vez de resolverlo', 'Está pagando toda su deuda', 'Está peleando con los acreedores', 'Está recortando el gasto'], answer: 0, terms: ['kickcan'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'CACs let a supermajority of bondholders bind the holdouts.', options: ['Una mayoría calificada puede imponer la reestructuración a quienes se niegan', 'Los acreedores minoritarios pueden bloquearlo todo', 'El país puede dejar de pagar sin consecuencias', 'Los holdouts reciben más dinero'], answer: 0, terms: ['cacs', 'holdout'] },
        ],
      },
      {
        id: 'u3l4', title: 'Carry y moneda local', icon: '💱',
        ex: [
          { type: 'mc', prompt: 'Un fondo se endeuda en yenes al 0.5 % e invierte en bonos mexicanos al 9 %. ¿Qué está haciendo?', options: ['Un carry trade, con el yen como moneda de fondeo', 'Una cobertura cambiaria', 'Un arbitraje sin riesgo', 'Una reestructuración de deuda'], answer: 0, terms: ['carrytrade', 'fundingccy'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'Carry trades unwound violently as the yen spiked.', options: ['Al subir el yen, los inversionistas cerraron de golpe sus posiciones de carry', 'Los inversionistas abrieron más carry trades', 'El yen se depreció con fuerza', 'Los bancos centrales compraron yenes'], answer: 0, terms: ['carrytrade', 'unwind'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'On an FX-hedged basis, the yield pickup disappears.', options: ['Si cubres el riesgo cambiario, el rendimiento extra desaparece: la cobertura cuesta el diferencial de tasas', 'Sin cobertura no hay rendimiento extra', 'La cobertura aumenta el rendimiento', 'El tipo de cambio no afecta el rendimiento'], answer: 0, terms: ['fxhedged'] },
          { type: 'match', pairs: [['funding currency', 'moneda de fondeo'], ['high-yielders', 'monedas de alto rendimiento'], ['FX-hedged', 'con cobertura cambiaria'], ['depreciation', 'depreciación'], ['intervention', 'intervención cambiaria']], terms: ['fundingccy', 'highyielders', 'fxhedged', 'depreciation', 'intervention'] },
          { type: 'mc', prompt: 'Tienes bonos locales colombianos. Ganan 6 % en pesos, pero el peso se deprecia 10 % frente al dólar. En dólares, ¿cómo te fue?', options: ['Perdiste ~4.6 %', 'Ganaste 16 %', 'Ganaste 6 %', 'Perdiste 10 %'], answer: 0, explain: '1.06 × 0.90 = 0.954 → −4.6 %. En moneda local, el tipo de cambio puede comerse todo el rendimiento.', terms: ['localccy', 'depreciation'] },
          { type: 'mc', prompt: '¿Por qué atrae a los inversionistas?', quote: 'Real rates in Brazil are among the highest in EM.', options: ['La tasa menos la inflación es muy alta: paga mucho en términos reales', 'Brasil tiene la inflación más baja', 'El real es la moneda más estable', 'Brasil tiene grado de inversión'], answer: 0, terms: ['realyield', 'em'] },
          { type: 'mc', prompt: '¿Qué hizo el banco central?', quote: "The central bank sold dollars in the spot market to stem the currency's slide.", options: ['Intervino vendiendo dólares para frenar la depreciación de su moneda', 'Compró dólares para debilitar su moneda', 'Subió la tasa de interés', 'Devaluó la moneda a propósito'], answer: 0, terms: ['intervention', 'reserves'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué dice?', say: 'Carry-to-vol still looks attractive in the Mexican peso.', options: ['El carry del peso mexicano, ajustado por su volatilidad, sigue siendo atractivo', 'El peso mexicano es demasiado volátil para invertir', 'La volatilidad del peso bajó a cero', 'El carry del peso desapareció'], answer: 0, terms: ['carrytovol'] },
          { type: 'mc', prompt: '¿Qué se espera?', quote: 'A Banxico cut should support the belly of the Mbono curve.', options: ['Un recorte del banco central de México favorecería los bonos locales de plazo medio', 'Banxico va a comprar bonos del Tesoro de EE. UU.', 'Los bonos mexicanos en dólares van a caer', 'La curva mexicana se invertirá'], answer: 0, explain: 'Banxico = banco central de México. Mbonos = bonos del gobierno mexicano en pesos, a tasa fija.', terms: ['cut', 'belly', 'localccy'] },
        ],
      },
      {
        id: 'u3l5', title: 'Leer una nota de estrategia', icon: '📑',
        ex: [
          { type: 'mc', prompt: 'Una nota de research empieza así. ¿Qué recomiendan?', quote: 'We stay overweight EM sovereign credit into year-end.', options: ['Tener más deuda soberana EM que el índice hasta fin de año', 'Vender toda la deuda EM antes de fin de año', 'Comprar acciones de mercados emergentes', 'Mantener una posición neutral'], answer: 0, terms: ['ow', 'sovereign', 'em'] },
          { type: 'mc', prompt: '¿Por qué siguen positivos si los spreads están estrechos?', quote: 'Spreads are tight versus history, but all-in yields near 7.5% keep attracting crossover demand.', options: ['Porque el rendimiento total (Treasury + spread) sigue alto y atrae compradores', 'Porque esperan que los spreads se amplíen', 'Porque los Treasuries van a bajar a cero', 'Porque los inversionistas EM están vendiendo'], answer: 0, terms: ['allin', 'tights', 'crossover'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Net supply should turn negative in the fourth quarter, as coupon and amortization payments exceed new issuance.', options: ['Los inversionistas recibirán en cupones y vencimientos más de lo que se emitirá: faltarán bonos, y eso apoya los precios', 'Los países emitirán más deuda que nunca', 'Los cupones serán negativos', 'Los emisores dejarán de pagar'], answer: 0, terms: ['netsupply', 'amortization', 'coupon'] },
          { type: 'mc', prompt: '¿Qué prefieren dentro de high yield?', quote: 'Within high yield, we favor frontier names with IMF anchors.', options: ['Países frontera con programas del FMI que dan financiamiento y disciplina', 'Grandes emergentes sin programa del FMI', 'Empresas privadas de alto rendimiento', 'Bonos con grado de inversión'], answer: 0, terms: ['names', 'anchor', 'frontier', 'favor'] },
          { type: 'mc', prompt: '¿Qué les haría equivocarse?', quote: 'Risks to our view: a disorderly rise in US term premium and a renewed rally in the dollar.', options: ['Que las tasas largas de EE. UU. suban de forma desordenada y que el dólar se fortalezca', 'Que la Fed recorte tasas', 'Que los spreads se estrechen aún más', 'Que haya pocas emisiones nuevas'], answer: 0, terms: ['risksview', 'termpremium'] },
          { type: 'match', pairs: [['all-in yield', 'rendimiento total'], ['net supply', 'oferta neta'], ['amortization', 'amortización'], ['names', 'emisores (en jerga)'], ['into year-end', 'hasta fin de año']], terms: ['allin', 'netsupply', 'amortization', 'names'] },
          { type: 'build', prompt: 'Preferimos high yield sobre grado de inversión.', answer: ['We', 'prefer', 'high', 'yield', 'over', 'investment', 'grade'], alts: [['We', 'favor', 'high', 'yield', 'over', 'investment', 'grade']], extra: ['under', 'favor'], terms: ['favor', 'hy', 'ig'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'We see value in the long end, where valuations have cheapened.', options: ['El tramo largo se abarató y les parece atractivo', 'El tramo largo está caro', 'No tienen opinión sobre el tramo largo', 'Van a vender bonos largos'], answer: 0, terms: ['seevalue', 'cheap', 'longend'] },
        ],
      },
    ],
  },
  {
    id: 'u4', title: 'Research de bancos', subtitle: 'Cómo recomiendan JPMorgan y compañía', color: 'purple',
    lessons: [
      {
        id: 'u4l1', title: 'El idioma del sell-side', icon: '🏦',
        ex: [
          { type: 'mc', prompt: '¿Qué están diciendo?', quote: 'We remain constructive but see limited upside from current tights.', options: ['Siguen positivos, pero los spreads ya están muy estrechos: poco margen para ganar', 'Recomiendan vender todo', 'Los spreads están muy amplios: hay mucho potencial', 'Van a construir una posición grande'], answer: 0, terms: ['constructive', 'upside', 'tights'] },
          { type: 'mc', prompt: '¿Qué están diciendo?', quote: 'We move to underweight.', options: ['Recomiendan tener menos de ese activo que el índice', 'Recomiendan comprar más', 'Esperan que el activo pese más en el índice', 'Suben su nivel de riesgo'], answer: 0, terms: ['uw'] },
          { type: 'mc', prompt: '¿Qué están diciendo?', quote: 'We would fade the rally.', options: ['Usarían la subida para vender, esperando que se revierta', 'Comprarían más para acompañar la subida', 'Esperarían a que termine el rally para comprar', 'No tienen opinión'], answer: 0, terms: ['fade', 'rally'] },
          { type: 'mc', prompt: '¿Qué apuesta es esta?', quote: 'We recommend receiving five-year SOFR swaps.', options: ['Que bajan las tasas a 5 años', 'Que suben las tasas a 5 años', 'Comprar un bono a 5 años de SOFR', 'Evitar los swaps'], answer: 0, explain: 'Recibir fijo en un swap gana si las tasas bajan (como estar comprado en un bono).', terms: ['receive', 'swaps', 'sofr'] },
          { type: 'match', pairs: [['overweight', 'sobreponderar'], ['base case', 'escenario base'], ['tail risk', 'riesgo de cola'], ['headwinds', 'vientos en contra'], ['stretched valuations', 'valoraciones exigentes']], terms: ['ow', 'basecase', 'tailrisk', 'headwinds', 'stretched'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Technicals remain supportive, with light supply and strong inflows.', options: ['Poca emisión y entrada de dinero favorecen los precios', 'Los fundamentales del país mejoraron', 'Hay demasiada oferta de bonos', 'Los analistas técnicos están optimistas'], answer: 0, terms: ['technicals', 'supply', 'flows'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Risks to our view include a hawkish Fed and a stronger dollar.', options: ['Lo que podría hacerlos equivocarse: una Fed dura y un dólar fuerte', 'Recomiendan comprar dólares', 'Lo que esperan que pase con seguridad', 'Los beneficios de su estrategia'], answer: 0, terms: ['risksview', 'hawkish'] },
          { type: 'build', prompt: 'Preferimos el tramo medio de la curva.', answer: ['We', 'favor', 'the', 'belly', 'of', 'the', 'curve'], extra: ['fade', 'long end'], terms: ['favor', 'belly'] },
        ],
      },
      {
        id: 'u4l2', title: 'Cómo se escribe un trade', icon: '✍️',
        ex: [
          { type: 'mc', prompt: 'Una nota dice:', quote: 'Trade idea: enter a 2s10s steepener at +45bp.', options: ['Abrir una posición que gana si el diferencial 10 años − 2 años sube desde 45 pb', 'Comprar bonos a 10 años con 45 pb de descuento', 'Vender el bono a 2 años en 45 pb', 'Esperar a que la curva se aplane'], answer: 0, terms: ['2s10s', 'steepen'] },
          { type: 'mc', prompt: 'Para armar un steepener 2s10s, ¿qué haces?', options: ['Compras el 2 años y vendes el 10 años', 'Vendes el 2 años y compras el 10 años', 'Compras ambos', 'Vendes ambos'], answer: 0, explain: 'Ganas si el rendimiento a 2 años baja frente al de 10: estás comprado en el 2 años (su precio sube) y vendido en el 10 años.', terms: ['steepen', 'longshort'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Put it on DV01-neutral.', options: ['Ajustar el tamaño de cada pata para que un movimiento paralelo de la curva no gane ni pierda', 'Invertir el mismo monto en dólares en cada bono', 'No usar apalancamiento', 'Cerrar la posición'], answer: 0, explain: 'El bono a 10 años es mucho más sensible que el de 2, así que se compra más nominal del 2 años.', terms: ['dv01', 'puton'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Target +80bp, stop +30bp.', options: ['Tomarán ganancias si llega a 80 pb y cortarán pérdidas si baja a 30 pb', 'Esperan que llegue a 30 pb', 'Ganarán 80 pb seguros', 'Arriesgan 80 pb'], answer: 0, terms: ['target', 'stoploss'] },
          { type: 'mc', prompt: 'Entrada +45, objetivo +80, stop +30. ¿Cuál es la relación riesgo-beneficio?', options: ['Arriesgas 15 pb para ganar 35 pb (≈ 2.3 a 1)', 'Arriesgas 35 pb para ganar 15 pb', 'Arriesgas 45 pb para ganar 80 pb', '1 a 1'], answer: 0, explain: 'Riesgo = 45 − 30 = 15 pb. Beneficio = 80 − 45 = 35 pb.', terms: ['riskreward'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Carry on the position is roughly flat.', options: ['Mantener la posición ni cuesta ni paga mucho con el paso del tiempo', 'La curva está plana', 'La posición pierde todos los días', 'La posición no tiene riesgo'], answer: 0, terms: ['carry'] },
          { type: 'match', pairs: [['target', 'objetivo'], ['stop loss', 'límite de pérdida'], ['risk-reward', 'riesgo-beneficio'], ['put on', 'abrir (una posición)'], ['high conviction', 'alta convicción']], terms: ['target', 'stoploss', 'riskreward', 'puton', 'conviction'] },
          { type: 'mc', prompt: '¿Por qué cierran la posición?', quote: 'We are closing the trade: our stop was hit.', options: ['El mercado llegó a su límite de pérdida', 'Alcanzaron el objetivo', 'Venció el bono', 'Cambió el analista'], answer: 0, terms: ['stoploss'] },
          { type: 'build', prompt: 'Tomamos ganancias en el steepener.', answer: ['We', 'take', 'profit', 'on', 'the', 'steepener'], extra: ['loss', 'flattener'], terms: ['tp', 'steepen'] },
        ],
      },
    ],
  },
  {
    id: 'u5', title: 'Leer a Matt Levine', subtitle: 'Ironía, conectores y el vocabulario de Money Stuff', color: 'red',
    lessons: [
      {
        id: 'u5l1', title: 'Ironía y conectores', icon: '😏',
        ex: [
          { type: 'mc', prompt: '¿Qué hace la estructura «Sure… But…»?', quote: "Sure, it's a little strange to lend money to a company that has announced it won't pay you back. But the yield is 14%.", options: ['Concede un punto y luego lo contradice', 'Expresa total acuerdo', 'Hace una pregunta', 'Cita a otra persona'], answer: 0, terms: ['m_sure', 'm_weird'] },
          { type: 'mc', prompt: '¿Qué quiere decir el autor?', quote: 'This is, I suppose, one way to run a bank.', options: ['Critica con ironía: es una mala forma de manejar un banco', 'Recomienda este modelo', 'No sabe cómo se maneja un banco', 'Explica una regla bancaria'], answer: 0, terms: ['m_oneway', 'm_suppose'] },
          { type: 'match', pairs: [['anyway', 'en fin'], ['I mean', 'o sea'], ['sort of', 'más o menos'], ['to be fair', 'para ser justos'], ['arguably', 'se podría decir que']], terms: ['m_anyway', 'm_imean', 'm_sortof', 'm_fair', 'm_arguably'] },
          { type: 'mc', prompt: '¿Cómo fue el trimestre?', quote: 'The quarter was, let us say, not great.', options: ['Malo (es un eufemismo)', 'Excelente', 'Normal', 'No se sabe'], answer: 0, terms: ['m_notgreat'] },
          { type: 'mc', prompt: 'La idea «everything is securities fraud» significa que…', options: ['Casi cualquier cosa mala que haga una empresa cotizada puede terminar en demanda por engañar a los accionistas', 'Todos los bonos son fraudulentos', 'Los reguladores no persiguen el fraude', 'Solo los bancos cometen fraude'], answer: 0, terms: ['secfraud', 'shareholders'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'The lenders engaged in some creditor-on-creditor violence.', options: ['Un grupo de acreedores mejoró su posición a costa de otros acreedores', 'Los acreedores demandaron al gobierno', 'Hubo una pelea física', 'Los acreedores perdonaron la deuda'], answer: 0, terms: ['cocv', 'uptier'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'Good for them, I guess.', options: ['Aprobación escéptica o irónica', 'Entusiasmo sincero', 'Enojo abierto', 'Neutral y técnico'], answer: 0, terms: ['m_goodforthem', 'm_suppose'] },
          { type: 'mc', prompt: '¿Qué quiere decir?', quote: 'That is not a bug in emerging-market debt. It is, in some sense, the whole point.', options: ['Lo que parece un defecto (que a veces no te pagan) es justo la razón del alto rendimiento', 'Hay un error en los datos de deuda EM', 'La deuda EM no tiene riesgos', 'Hay que evitar la deuda EM'], answer: 0, terms: ['feature', 'm_insense'] },
        ],
      },
      {
        id: 'u5l2', title: 'Vocabulario de Money Stuff', icon: '📰',
        ex: [
          { type: 'match', pairs: [['short seller', 'vendedor en corto'], ['market maker', 'creador de mercado'], ['arbitrage', 'arbitraje'], ['insider trading', 'información privilegiada'], ['private credit', 'crédito privado']], terms: ['shortseller', 'mm', 'arb', 'insider', 'privatecredit'] },
          { type: 'mc', prompt: '¿Qué es el «basis trade»?', quote: 'The basis trade is back, and people are worried about it.', options: ['Comprar Treasuries, vender futuros y apalancarse con repo; preocupa su tamaño', 'Comprar acciones con descuento', 'Una operación sin riesgo que nadie hace', 'Una operación con monedas emergentes'], answer: 0, terms: ['basistrade', 'worried', 'repo'] },
          { type: 'mc', prompt: '¿Qué hizo el fondo?', quote: 'The fund bought the bonds at 60 cents and then negotiated an uptier.', options: ['Compró barato y pactó subir su prelación frente a otros acreedores', 'Vendió los bonos con pérdida', 'Demandó a la empresa', 'Cobró el valor completo'], answer: 0, terms: ['cents', 'uptier'] },
          { type: 'mc', prompt: '¿Qué es «Things happen» en Money Stuff?', options: ['La sección final con enlaces breves a otras noticias', 'Una advertencia legal', 'El título de cada newsletter', 'Preguntas de lectores'], answer: 0, terms: ['thingshappen'] },
          { type: 'mc', prompt: '¿Qué son los «pods»?', quote: 'Multistrategy hedge funds run hundreds of pods.', options: ['Equipos de traders independientes, cada uno con su capital y límite de riesgo', 'Cápsulas de café', 'Fondos indexados', 'Oficinas regionales'], answer: 0, terms: ['hedgefund'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The volatility is a feature, not a bug.', options: ['Lo que parece un defecto es intencional o esencial', 'Hay un error de software', 'Es un detalle técnico sin importancia', 'Es un insecto'], answer: 0, terms: ['feature'] },
          { type: 'build', prompt: 'Los vendedores en corto publicaron un informe.', answer: ['The', 'short', 'sellers', 'published', 'a', 'report'], extra: ['bought', 'long'], terms: ['shortseller'] },
        ],
      },
      {
        id: 'u5l3', title: 'Crédito privado y LMEs', icon: '🧩',
        ex: [
          { type: 'mc', prompt: '¿Qué hacen estos fondos?', quote: 'Private credit funds lend directly to midsize companies, usually at floating rates.', options: ['Prestan directamente a empresas medianas, normalmente a tasa variable', 'Compran acciones de empresas pequeñas', 'Emiten bonos del gobierno', 'Prestan a personas con tarjetas de crédito'], answer: 0, terms: ['privatecredit'] },
          { type: 'mc', prompt: '¿Es buena señal?', quote: 'The borrower switched to PIK interest.', options: ['No: la empresa paga intereses con más deuda en vez de efectivo, señal de estrés', 'Sí: la empresa pagó toda su deuda', 'Sí: bajaron los intereses', 'Neutral: es un cambio contable'], answer: 0, terms: ['pik'] },
          { type: 'mc', prompt: '¿Cuál es la preocupación?', quote: "The loans don't trade, so the fund just marks them.", options: ['Su valor depende de la valoración que hace el propio fondo, no de un precio de mercado', 'Los préstamos son ilegales', 'Los préstamos se venden todos los días', 'El fondo no cobra intereses'], answer: 0, terms: ['marks', 'liquidity'] },
          { type: 'mc', prompt: '¿Qué hizo la empresa?', quote: 'The company moved its intellectual property into an unrestricted subsidiary and borrowed against it.', options: ['Sacó activos del alcance de sus acreedores actuales para usarlos como garantía de deuda nueva (un «drop-down»)', 'Vendió su propiedad intelectual a los acreedores', 'Pagó a todos sus acreedores', 'Se declaró en quiebra'], answer: 0, terms: ['unsub', 'uptier', 'collateral'] },
          { type: 'mc', prompt: '¿Por qué firman esto?', quote: 'Lenders signed a cooperation agreement to avoid being left out of the next LME.', options: ['Para negociar juntos y que ningún grupo los deje atrás en una reestructuración', 'Para prestar más dinero a la empresa', 'Para demandar a los accionistas', 'Para vender sus préstamos'], answer: 0, terms: ['coop', 'lme'] },
          { type: 'match', pairs: [['private credit', 'crédito privado'], ['PIK', 'pago en especie'], ['covenant-lite', 'casi sin cláusulas'], ['marks', 'valoraciones'], ['amend and extend', 'modificar y extender']], terms: ['privatecredit', 'pik', 'covenant', 'marks', 'amendextend'] },
          { type: 'mc', prompt: '¿Qué tono tiene?', quote: 'It is a great business, as long as nobody asks for their money back.', options: ['Ironía: señala el riesgo de liquidez', 'Elogio sincero', 'Explicación técnica neutral', 'Queja de un cliente'], answer: 0, explain: 'Frase original al estilo Money Stuff: el elogio esconde la crítica (si todos piden su dinero a la vez, hay problemas).', terms: ['liquidity'] },
          { type: 'build', prompt: 'Los acreedores negociaron un uptier.', answer: ['The', 'lenders', 'negotiated', 'an', 'uptier'], extra: ['default', 'bought'], terms: ['uptier'] },
        ],
      },
    ],
  },
  {
    id: 'u6', title: 'En la mesa y al cierre', subtitle: 'Jerga de traders, The Close y temporada de resultados', color: 'teal',
    lessons: [
      {
        id: 'u6l1', title: 'Hablar como trader', icon: '📞',
        ex: [
          { type: 'mc', prompt: '¿Qué te piden?', quote: 'Where are you in tens?', options: ['Tu precio de compra y de venta para el bono a 10 años', 'Dónde está tu oficina', 'Cuántos bonos a 10 años tienes', 'Tu opinión sobre la curva'], answer: 0, terms: ['tens', 'twoway'] },
          { type: 'mc', prompt: '¿Qué dice el trader?', quote: "I'm 10 bid, at 12.", options: ['Compra a …10 y vende a …12', 'Compra a …12 y vende a …10', 'Tiene 10 bonos y quiere 12', 'Su precio subió de 10 a 12'], answer: 0, explain: '«X bid, at Y» = compro a X, vendo a Y (el «at» es el offer). En Treasuries, esos números suelen ser 32avos.', terms: ['bid', 'offered'] },
          { type: 'mc', prompt: 'Un trader dice «Mine!». ¿Qué hace?', options: ['Compra al precio de venta que le mostraron', 'Vende al precio de compra', 'Cancela la orden', 'Pide más tiempo'], answer: 0, terms: ['mine', 'liftoffer'] },
          { type: 'mc', prompt: '¿Y si dice «Yours!»?', options: ['Vende al precio de compra que le mostraron', 'Compra al precio de venta', 'Te regala el bono', 'Rechaza el precio'], answer: 0, terms: ['yours', 'hitbid'] },
          { type: 'mc', prompt: '¿Qué pide el cliente?', quote: 'Can you show me a two-way in size?', options: ['Un precio de compra y de venta para un monto grande', 'Dos bonos distintos', 'Un precio válido por dos días', 'Una operación en dos partes'], answer: 0, terms: ['twoway', 'size'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: "We're axed to sell the 2034s.", options: ['El banco quiere vender esos bonos: te dará buen precio si compras', 'El banco tiene prohibido venderlos', 'El banco ya los vendió todos', 'Los bonos 2034 bajaron'], answer: 0, terms: ['axe'] },
          { type: 'input', prompt: 'Escucha: ¿cuántos millones puede operar?', say: 'I can do five bucks at ninety-nine and a half.', numeric: true, answer: 5, explain: '«Five bucks» = 5 millones de nominal, a un precio de 99.5.', terms: ['buck'] },
          { type: 'match', pairs: [['bid', 'precio de compra'], ['offer', 'precio de venta'], ['Mine!', '¡Compro!'], ['Yours!', '¡Vendo!'], ['a yard', 'mil millones']], terms: ['bid', 'offered', 'mine', 'yours', 'yard'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'Done. Five million at 99 and a half, you buy.', options: ['Operación cerrada: compras 5 millones a 99.5', 'Se canceló la operación', 'Vendes 5 millones a 99.5', 'Te ofrecen 99.5 millones'], answer: 0, terms: ['buck'] },
        ],
      },
      {
        id: 'u6l2', title: 'The Close: el cierre', icon: '🔔',
        ex: [
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'The S&P 500 closed at a record high.', options: ['El índice cerró en su máximo histórico', 'El índice tuvo su peor día', 'El índice cerró temprano', 'El índice rompió un récord de volumen'], answer: 0, terms: ['sp500', 'ath'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Breadth was weak: megacaps did all the lifting.', options: ['Pocas acciones subieron: solo las gigantes empujaron el índice', 'Todas las acciones subieron', 'Las gigantes cayeron', 'No hubo operaciones'], answer: 0, terms: ['breadth', 'megacaps'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'Small caps outperformed as yields fell.', options: ['Las empresas pequeñas subieron más que el resto al bajar los rendimientos', 'Las pequeñas cayeron por las tasas', 'Los bonos subieron más que las acciones', 'Las gigantes lideraron'], answer: 0, explain: 'Las empresas pequeñas tienen más deuda a tasa variable: les ayuda que bajen las tasas.', terms: ['smallcaps', 'yield'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The VIX jumped above 25.', options: ['Subió el nerviosismo: la volatilidad esperada del S&P 500 es alta', 'El S&P 500 subió 25 %', 'Bajó la volatilidad', 'Hay 25 empresas en problemas'], answer: 0, terms: ['vix'] },
          { type: 'match', pairs: [['record high', 'máximo histórico'], ['breadth', 'amplitud del mercado'], ['small caps', 'empresas pequeñas'], ['rotation', 'rotación sectorial'], ['closing bell', 'campana de cierre']], terms: ['ath', 'breadth', 'smallcaps', 'rotation', 'closingbell'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: "There's a big sell imbalance heading into the close.", options: ['Hay muchas más órdenes de venta que de compra programadas para el cierre', 'El mercado cerró antes', 'Hay un error en los precios', 'Los compradores dominan el cierre'], answer: 0, terms: ['moc', 'closingbell'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué pasó?', say: 'The Nasdaq fell one point two percent, while the Dow was little changed.', options: ['El Nasdaq cayó 1.2 % y el Dow casi no se movió', 'El Nasdaq cayó 12 % y el Dow subió', 'Ambos cayeron 1.2 %', 'El Dow cayó 1.2 %'], answer: 0, terms: ['nasdaq', 'dow'] },
          { type: 'mc', prompt: '¿Qué están haciendo los inversionistas?', quote: "It's a classic rotation out of tech and into defensives.", options: ['Venden tecnología y compran sectores defensivos (salud, consumo básico, servicios públicos)', 'Compran más tecnología', 'Venden todo y compran bonos', 'Compran empresas pequeñas'], answer: 0, terms: ['rotation', 'defensives'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'Stocks are down 10% from their peak, officially in correction territory.', options: ['Bajaron 10 % desde el máximo: técnicamente, una corrección', 'Entraron en un mercado bajista', 'Se corrigió un error en los precios', 'Recuperaron un 10 %'], answer: 0, explain: 'Corrección = −10 % desde el máximo. Mercado bajista (bear market) = −20 %.', terms: ['correction'] },
        ],
      },
      {
        id: 'u6l3', title: 'Temporada de resultados', icon: '📊',
        ex: [
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'The company beat on the top and bottom lines.', options: ['Superó lo esperado en ingresos y en utilidad neta', 'Decepcionó en ingresos y en utilidad', 'Cambió su logo', 'Subió y bajó en el mismo día'], answer: 0, terms: ['beat', 'topline'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'It raised full-year guidance.', options: ['Subió sus previsiones para el año completo', 'Bajó sus previsiones', 'Contrató un nuevo asesor', 'Pagó un dividendo'], answer: 0, terms: ['guidance'] },
          { type: 'mc', prompt: '¿Por qué cayó la acción?', quote: 'Shares fell despite the beat, because the guide was light.', options: ['Los resultados fueron buenos, pero la previsión futura decepcionó', 'Los resultados fueron malos', 'La empresa recompró acciones', 'El mercado estaba cerrado'], answer: 0, terms: ['beat', 'guidance'] },
          { type: 'match', pairs: [['revenue', 'ingresos'], ['EPS', 'utilidad por acción'], ['margins', 'márgenes'], ['guidance', 'previsiones'], ['buyback', 'recompra de acciones']], terms: ['topline', 'eps', 'margins', 'guidance', 'buyback'] },
          { type: 'mc', prompt: '¿Qué pasó?', quote: 'Margins compressed on higher input costs.', options: ['Los márgenes se redujeron porque subieron los costos', 'Los márgenes crecieron', 'Bajaron los costos', 'La empresa comprimió su balance'], answer: 0, terms: ['margins'] },
          { type: 'mc', prompt: '¿Qué significa?', quote: 'The stock trades at 30 times forward earnings.', options: ['El precio equivale a 30 veces la utilidad esperada para los próximos 12 meses', 'La acción subió 30 veces', 'La empresa gana 30 dólares por acción', 'La acción vale 30 dólares'], answer: 0, terms: ['multiple', 'earnings'] },
          { type: 'mc', prompt: '¿De dónde vino la subida?', quote: "Multiple expansion drove most of this year's gains.", options: ['El mercado paga más por cada dólar de utilidad, más que un aumento de las utilidades', 'Las utilidades se duplicaron', 'Las empresas emitieron más acciones', 'Bajaron los márgenes'], answer: 0, terms: ['multiple'] },
          { type: 'mc', prompt: 'Escucha. ¿Qué pasó?', say: 'Shares jumped eight percent in after-hours trading after the company announced a ten billion dollar buyback.', options: ['La acción subió 8 % después del cierre al anunciar una recompra de 10 mil millones', 'La acción cayó 8 % antes de la apertura', 'La empresa emitió 10 mil millones en acciones', 'La acción subió 10 %'], answer: 0, terms: ['premarket', 'buyback'] },
          { type: 'build', prompt: 'La empresa superó las estimaciones.', answer: ['The', 'company', 'beat', 'estimates'], extra: ['missed', 'guided'], terms: ['beat'] },
        ],
      },
    ],
  },
];

export const ALL_LESSONS = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));
export const lessonById = id => ALL_LESSONS.find(l => l.id === id);
