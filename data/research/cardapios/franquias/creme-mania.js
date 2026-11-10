/* Cardápio universal da Creme Mania (franquia de sorvetes e açaí do Vale do Araguaia).
   Base: cardápio digital da unidade de São Félix do Araguaia no Mais Delivery (50 itens, todos com foto), com os
   preços conferidos contra Água Boa e Vila Rica (mesma tabela da franquia). Reorganizado no padrão do PedeAi: um
   produto por sabor, tamanho como escolha (preço base = menor tamanho). Fotos: as da própria franquia. */
const L = require('../../../../scripts/menus/lib.js');
const IMG = 'https://maisdeliveryfranquia.com.br/api/imagens/cardapio/';
const snap = require('../creme-mania-sorvetes-e-acai-sao-felix-do-araguaia.json');
const all = snap.sections.flatMap(s => s.items);
const photo = name => (all.find(i => i.name === name) || {}).imageUrl || null;
const id = L.idFactory();
const sizes = list => { const base = list[0][1]; return L.optionGroup('Tamanho', 1, 1, list.map(([n, p]) => ({ name: n, priceCents: Math.round((p - base) * 100) }))); };
const group = (title, min, max, names) => L.optionGroup(title, min, max, names.map(n => typeof n === 'string' ? { name: n, priceCents: 0 } : { name: n[0], priceCents: Math.round(n[1] * 100) }));
const item = (name, desc, list, img, extra) => ({ sourceId: id(name), name, description: desc, priceCents: Math.round(list[0][1] * 100), originalPriceCents: null,
  imageUrl: photo(img), options: [list.length > 1 ? sizes(list) : null].concat(extra || []).filter(Boolean) });

const gratis = () => group('Escolha até 3 acompanhamentos grátis', 0, 3, ['Amendoim', 'Calda de morango', 'Cereja artificial', 'Disquetes', 'Farinha láctea', 'Granola', 'Leite condensado', 'Misto', 'Ovomaltine em pó', 'Paçoca', 'Sorvete', 'Sucrilhos']);
const extras = () => group('Adicionais extras', 0, 21, [['Banana', 2.5], ['Calda de morango', 2.5], ['Cereja artificial', 2.5], ['Cereja (fruta)', 6], ['Chantilly', 6], ['Creme de doce de leite', 6], ['Creme de ninho', 6], ['Creme de Ovomaltine', 6], ['Disquete', 2.5], ['Farinha láctea', 2.5], ['Gotas de chocolate', 3], ['Granola', 2.5], ['Leite condensado', 2.5], ['Leite Ninho', 3], ['M&M\'s', 6], ['Nutella', 6], ['Ovomaltine em pó', 2.5], ['Paçoca', 2.5], ['Sorvete', 2.5], ['Sucrilhos', 2.5]]);
const AC = [['330 ml', 20], ['440 ml', 24], ['550 ml', 25], ['770 ml', 35]];
const cobertura = () => group('Cobertura', 1, 1, ['Caramelo', 'Chocolate', 'Morango']);
const coberturaTop = () => group('Cobertura', 1, 1, ['Caramelo', 'Chocolate', 'Morango', 'Sundae kids']);
const TOP = 'Sorvete de baunilha com paçoca, canudo de waffer e cereja.';

module.exports = {
  source: 'https://maisdeliveryapp.com.br/web/loja.php?id=NTA5NjM=',
  note: 'Cardápio universal da Creme Mania (base: unidade de São Félix do Araguaia no Mais Delivery, preços iguais aos de Água Boa e Vila Rica), aplicado a unidade sem cardápio digital próprio a pedido do Pedro (10/11/2026).',
  sections: [
    { name: 'Açaí', items: [
      Object.assign(item('Açaí', 'Com direito a 3 acompanhamentos grátis.', AC, 'Açaí 440ml', [gratis(), extras()]), { featured: true }),
      item('Milk shake de açaí', 'Milk shake de açaí com até 3 acompanhamentos grátis.', AC, 'Milk shake de açai 440ml', [gratis(), extras()]),
      item('Açaí 1 kg', '', [['1 kg', 35]], 'Açaí 1kg creme mania')
    ] },
    { name: 'Milk shakes', items: [
      Object.assign(item('Milk shake', 'Escolha o sabor do seu milk shake.', [['330 ml', 12], ['440 ml', 15], ['550 ml', 18], ['700 ml', 25]], 'Milk shake 330 ml',
        [group('Sabor', 1, 1, ['Abacaxi', 'Amora', 'Café gelado', 'Cereja', 'Leite Ninho', 'Maracujá', 'Morango', 'Ovomaltine', 'Paçoquinha'])]), { featured: true }),
      item('Milk shake especial', 'Milk shake no seu sabor preferido, com Nutella e chantilly.', [['330 ml', 18], ['440 ml', 22.5], ['550 ml', 25]], 'Milk shake especial 330 ml',
        [group('Sabor', 1, 1, ['Amora', 'Café gelado', 'Leite Ninho', 'Maracujá', 'Morango', 'Ovomaltine'])]),
      item('Cookies and cream (milk de colher)', 'Sorvete, leite Ninho, creme de ninho e biscoito Negresco. 330 ml.', [['330 ml', 20]], 'Cookies e cream 330ml')
    ] },
    { name: 'Sundae', items: [
      item('Sundae', 'Sorvete de baunilha com a calda que você escolher, castanhas e canudo de waffer.', [['180 ml', 7.5], ['330 ml', 10], ['440 ml', 15], ['550 ml', 18], ['770 ml', 25]], 'Sundae 180 ml', [cobertura()]),
      item('Sundae creme de ninho', 'Sorvete de baunilha com creme de ninho, castanhas e canudo de waffer.', [['180 ml', 10], ['330 ml', 12.5], ['440 ml', 18], ['550 ml', 20]], 'Sundae creme de ninho 180 ml'),
      item('Sundae morango trufado', 'Sorvete de baunilha com morango trufado, castanhas e canudo de waffer.', [['180 ml', 10], ['330 ml', 12.5], ['440 ml', 18], ['550 ml', 20]], 'Sundae morango trufado 180 ml')
    ] },
    { name: 'Top sundae', items: [
      Object.assign(item('Top sundae', 'Sorvete de baunilha com a cobertura que você escolher, paçoca, canudo de waffer e cereja.', [['180 ml', 10], ['330 ml', 12.5], ['440 ml', 18], ['550 ml', 20], ['770 ml', 30]], 'Top sundae 180 ml', [coberturaTop()]), { featured: true }),
      item('Top sundae creme de ninho', 'Sorvete de baunilha com creme de ninho, cobertura à sua escolha, paçoca, canudo de waffer e cereja.', [['180 ml', 10], ['330 ml', 12.5], ['440 ml', 20], ['550 ml', 20]], 'Top sundae creme de ninho 180 ml', [coberturaTop()]),
      item('Top sundae morango trufado', 'Sorvete de baunilha com morango trufado, cobertura à sua escolha, paçoca, canudo de waffer e cereja.', [['180 ml', 10], ['330 ml', 12.5], ['440 ml', 20]], 'Top sundae morango trufado 180 ml', [coberturaTop()]),
      item('Top sundae de morango 550 ml', TOP, [['550 ml', 20]], 'Top sundae morango 550 ml', [coberturaTop()])
    ] },
    { name: 'Fruit mix e Mix', items: [
      item('Fruit mix', 'Sorvete, calda de fruta e chantilly.', [['200 ml', 10], ['440 ml', 20]], 'Fruit mix 200 ml', [group('Sabor', 1, 1, ['Abacaxi', 'Amora', 'Maracujá', 'Morango'])]),
      item('Mix mania 440 ml', '', [['440 ml', 20]], 'Mix mania 440 ml', [group('Sabor', 0, 1, ["M&M's", 'Ovomaltine'])])
    ] },
    { name: 'Potes de 1 litro', items: [
      item('Pote 1 L chocolate trufado', '', [['1 L', 35]], 'Pote 1l chocolate trufado'),
      item('Pote 1 L maracujá com creme americano', '', [['1 L', 35]], 'Pote 1l maracujá c/ creme americano'),
      item('Pote 1 L morango com creme americano', '', [['1 L', 35]], 'Pote 1l morango c/ creme americano'),
      item('Pote 1 L torta alemã', '', [['1 L', 35]], 'Pote 1l torta alema')
    ] }
  ]
};
