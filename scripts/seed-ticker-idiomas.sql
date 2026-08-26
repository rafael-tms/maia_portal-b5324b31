-- Faixa rolante da hero (hero_ticker) nos idiomas que faltavam.
--
-- O PT já foi preenchido pelo admin e não é tocado aqui.
-- O merge por idioma preserva hero_text e characteristics que já existem
-- dentro de cada translations->'<idioma>'.
--
-- Vocabulário alinhado ao que a página já usa: o primeiro item repete o termo
-- do kicker ("FOOTBALLER — STRIKER" etc.), e os demais seguem os termos de
-- characteristics, para a hero não falar duas línguas diferentes.

UPDATE player_stats SET
  translations = COALESCE(translations, '{}'::jsonb)
    || jsonb_build_object('en', COALESCE(translations->'en', '{}'::jsonb) || jsonb_build_object('hero_ticker',
         'STRIKER · TWO-FOOTED · FREE-KICK TAKER · GAME VISION'))
    || jsonb_build_object('es', COALESCE(translations->'es', '{}'::jsonb) || jsonb_build_object('hero_ticker',
         'DELANTERA CENTRO · AMBIDIESTRA · LANZADORA DE FALTAS · LECTURA DE JUEGO'))
    || jsonb_build_object('de', COALESCE(translations->'de', '{}'::jsonb) || jsonb_build_object('hero_ticker',
         'MITTELSTÜRMERIN · BEIDFÜSSIG · FREISTOSSSCHÜTZIN · SPIELÜBERSICHT'))
    || jsonb_build_object('fr', COALESCE(translations->'fr', '{}'::jsonb) || jsonb_build_object('hero_ticker',
         'AVANT-CENTRE · AMBIDEXTRE · TIREUSE DE COUPS FRANCS · LECTURE DU JEU'))
    || jsonb_build_object('it', COALESCE(translations->'it', '{}'::jsonb) || jsonb_build_object('hero_ticker',
         'CENTRAVANTI · AMBIDESTRA · TIRATRICE DI PUNIZIONI · LETTURA DEL GIOCO'))
;
