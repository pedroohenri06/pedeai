# Prompt para o Claude in Chrome — auditoria de cardápios pelo Instagram

Abra o Instagram já logado no Chrome, abra a extensão do Claude e cole tudo abaixo da linha.
Se for muita loja para uma conversa só, mande uma cidade por vez (troque a lista).

---

Você vai me ajudar a achar o **cardápio digital** de restaurantes do Vale do Araguaia (MT) para a plataforma PedeAi. Eu estou logado no Instagram neste navegador. Trabalhe loja por loja, na ordem da lista, sem pular nenhuma.

## Para cada loja da lista
1. Abra `https://www.instagram.com/<@ da loja>/`. Confira se o perfil é da loja certa: nome parecido e **cidade da lista** (na bio, na localização dos posts ou no endereço). Se o @ não existir ou for de outra cidade, procure no Instagram pelo nome da loja + cidade. Se não achar, anote "perfil não encontrado".
2. **Link da bio:** clique no link da bio (Linktree, bio.site, contate.me, beacons, site próprio etc.). Na página que abrir, procure botões como "Cardápio", "Cardápio digital", "Delivery", "Faça seu pedido", "Peça aqui" ou "Pedir online", e clique neles. Anote o **endereço final** que abrir (a página do cardápio, não o Linktree). Plataformas comuns: aiqfome, anota.ai, menudino, cardapioweb, goomer, brendi, saipos, meucardapio.ai, ola.click, foodsapp, bigd.im, takeat, maisdeliveryapp, vendanozap, zapdelivery, pedir.delivery, ifood.
3. **WhatsApp:** anote o número do botão WhatsApp do perfil ou do link da bio (o número, não só o link). Diga de onde veio.
4. **Destaques:** se o link da bio não tiver cardápio, abra os destaques com nome parecido com "Cardápio", "Menu", "Preços", "Lanches", "Pizzas" ou "Delivery".
   - Se o destaque tiver um **link** (figurinha de link), abra e anote o endereço final.
   - Se o cardápio for **imagem**, anote quantas telas tem, o nome do destaque e se tem preços legíveis. Não tente transcrever.
5. **Não invente nada.** Se não achar, escreva "não achado" e diga onde procurou. Não faça pedidos, não mande mensagens, não siga perfis, não curta nada.
6. Confira sempre a cidade do cardápio digital (muitas lojas têm nome igual em outros estados). Se a página do cardápio mostrar outra cidade, anote "cidade diferente: <cidade>".

## Formato da resposta
Ao terminar cada cidade, me devolva **uma linha JSON por loja**, exatamente neste formato, dentro de um bloco de código:

```
{"id":"<id da lista>","perfil":"<url do instagram conferido>","linkBio":"<url ou null>","cardapio":"<url final do cardápio digital ou null>","plataforma":"<nome ou null>","whatsapp":"<só números com 55+DDD ou null>","whatsappFonte":"<perfil|link da bio|cardápio|null>","destaqueCardapio":"<nome do destaque e nº de telas, ou null>","cidadeConferida":true,"obs":"<o que mais for útil>"}
```

No fim, faça um resumo: quantas lojas têm cardápio digital, quantas têm só cardápio em imagem no destaque e quantas não têm nada.

## Lista (id | nome | @instagram), por cidade

## Vila Rica (13)
- acai-super-top-vila-rica | Açaí Super Top | @acaisupertop
- brownieria-vila-rica | Brownieria | @sbrownieartesanal
- cforno-cia-artesanal-vila-rica | CForno&Cia Artesanal | @cfornoecia.artesanal
- crep-s-da-mari-vila-rica | Crep's da Mari | @creps_dmari
- doce-estouro-pipocas-gourmet-vila-rica | Doce Estouro | Pipocas Gourmet | @doceesttouro
- ke-pudim-vila-rica | KE Pudim | @pudim_ke
- mily-doces-vila-rica | Mily Doces | @mily.doces_
- minis-da-michele-vila-rica | Minis da Michele | @minisdamichele
- pastelar-vila-rica | Pastelar | @pastelar2026
- pizzaria-gomes-vila-rica | Pizzaria Gomes | @gomespizzaria_vr
- rs-confeitaria-vila-rica | RS Confeitaria | @rsconfeitaria374
- tare-sushi-vila-rica | Tarê Sushi | @taresushi2024
- villa-grill-churrascaria-e-restaurante-vila-rica | Villa Grill Churrascaria e Restaurante | @villagrill2026

## São Félix do Araguaia (2)
- restaurante-solar-das-aguas-sao-felix-do-araguaia | Restaurante Solar das Águas | @_solardasaguas
- vania-confeitaria-sao-felix-do-araguaia | Vânia Confeitaria | @vania_confeitaria_oficial

## Querência (28)
- 60-sabores-artesanal-querencia-querencia | 60 Sabores Artesanal Querência | @60sabores_querencia
- armazem-pizzaria-artesanal-querencia | Armazém Pizzaria Artesanal | @artesanal_armazem
- bom-sabor-sorveteria-e-acaiteria-querencia | Bom Sabor Sorveteria e Açaiteria | @bom.sabor_querencia
- casa-da-pizza-de-querencia-querencia | Casa da Pizza de Querência | @casadapizzaquerencia
- churrascaria-rancho-do-vale-querencia | Churrascaria Rancho do Vale | @churrascariaranchodovale
- churrascaria-restaurante-e-hotel-estrela-do-sul-querencia | Churrascaria Restaurante e Hotel Estrela do Sul | @rest.estreladosulquerencia
- cuscuz-da-mainha-querencia | Cuscuz da Mainha | @cuscuzdamainha
- degust-massas-querencia | Degust Massas | @degustquerencia
- dolce-affetto-confeitaria-querencia | Dolce Affetto Confeitaria | @dolce_affettoconfeitaria
- encanto-de-sabores-querencia | Encanto de Sabores | @encantodesabores_26
- espetinho-do-gordinho-querencia | Espetinho do Gordinho | @espetinhodogordinhomt
- gg-burguer-querencia | GG Burguer | @ggburguer_quer
- kali-doces-querencia | Kali Doces | @kali_doces27
- karol-doces-querencia | Karol Doces | @karoldocesg
- leidy-cakes-querencia | Leidy Cakes | @coelho.leidycakes
- mp-sabor-e-docura-querencia | MP Sabor e Doçura | @mpsaboredocura
- nini-gelato-artesanal-querencia | Nini Gelato Artesanal | @ninigelatoartesanal_
- owzi-burger-querencia | Owzi Burger | @owziburger
- panificadora-central-querencia | Panificadora Central | @panificadora_central_
- pizzaria-imperial-delivery-querencia | Pizzaria Imperial Delivery | @imperial7530
- prii-pipocas-gourmet-querencia | Prii Pipocas Gourmet | @priipipocas.gourmet
- quintal-sorveteria-querencia | Quintal Sorveteria | @quintalsorveteria
- rancho-dos-sabores-querencia | Rancho dos Sabores | @rancho_dos__sabores
- real-gelados-querencia | Real Gelados | @real_geladosquerencia
- rei-do-hamburguer-querencia | Rei do Hambúrguer | @rei_do_hamburguer_qrc
- sabor-na-caixa-querencia | Sabor na Caixa | @delivery_sabor_na_caixa
- takaki-sushi-querencia | Takaki Sushi | @takakisushi
- tia-do-lanche-querencia | Tia do Lanche | @tiadolancheee

## Ribeirão Cascalheira (6)
- amor-sabor-ribeirao-cascalheira | Amor & Sabor | @amoresaborrc
- delicias-da-nutri-ribeirao-cascalheira | Delícias da Nutri | @deliciasdanutri_rc
- kendyy-lanches-ribeirao-cascalheira | Kendyy Lanches | @kendylla_lanches_2.0
- lanchonete-e-restaurante-sabor-do-araguaia-ribeirao-cascalheira | Lanchonete e Restaurante Sabor do Araguaia | @sabordoaraguaia
- pizzaria-kabanas-ribeirao-cascalheira | Pizzaria Kabanas | @pizzariakabanas20
- sorveteria-d-acai-ribeirao-cascalheira | Sorveteria D+ Açaí | @d.mais.acai

## Canarana (23)
- acai-das-meninas-canarana | Açaí das Meninas | @acai.das.meninas.ofc
- bolo-bom-canarana | Bolo Bom | @bolo_bomboloedoces
- bruto-espetaria-canarana | Bruto Espetaria | @bruto_espetaria
- casa-da-pizza-delivery-canarana | Casa da Pizza Delivery | @casadapizzacanarana
- chapa-quente-lanches-canarana | Chapa Quente Lanches | @chapaquente_cnn
- churrascaria-do-jiovani-canarana | Churrascaria do Jiovani | @churrascariadojiovani_canarana
- delicias-da-keylla-canarana | Delícias da Keylla | @delicias_da_keillla
- dona-sonia-restaurante-canarana | Dona Sônia Restaurante | @donasoniarestaurante8
- emporio-do-chocolate-e-brigadeiria-canarana | Empório do Chocolate e Brigadeiria | @emporiodochocolateebrigadeiria
- flomas-burguer-canarana | Flomas Burguer | @flomas_burguer
- frangolino-canarana | Frangolino | @frangolinocanarana
- gabriela-cakes-canarana | Gabriela Cakes | @gabrielacakes.canarana
- la-no-tche-churrascaria-canarana | Lá no Tchê Churrascaria | @lanotche_churrascaria
- la-pastelli-canarana | La Pastelli | @la_pastellicanarana
- marcio-lanches-canarana | Márcio Lanches | @marcio.lanchonete
- massas-delivery-canarana-canarana | Massas Delivery Canarana | @massas_deliverycanarana
- paulus-cafe-central-canarana | Paulus Café Central | @pauluscafecentral
- real-gelados-canarana-canarana | Real Gelados Canarana | @realgeladoscanarana
- restaurante-ponto-certo-e-conveniencia-canarana | Restaurante Ponto Certo e Conveniência | @restaurantepontocerto2026
- restaurante-tempero-baiano-canarana | Restaurante Tempero Baiano | @restaurante_temperobaianolu
- rossi-batataria-e-pizzaria-canarana | Rossi Batataria e Pizzaria | @rossibatatariacanarana
- sorveteria-e-lanchonete-paloma-canarana | Sorveteria e Lanchonete Paloma | @sorveteriapaloma_mt
- texas-burger-grill-canarana | Texas Burger & Grill | @texasburgeregrill24

## Água Boa (18)
- bocao-lanches-ab-agua-boa | Bocão Lanches AB | @bocaolanches.ab
- bom-manjare-agua-boa | Bom Manjare | @bom_manjare_ab
- caseiro-s-marmitaria-agua-boa | Caseiro's Marmitaria | @caseiros_marmitaria
- d-talia-agua-boa-agua-boa | D'tália Água Boa | @dtaliaaguaboa
- delicias-da-jujuzinha-agua-boa | Delícias da Jujuzinha | @deliciasdajujuzinhaa
- doces-do-vale-agua-boa | Doces do Vale | @doce.sdovale
- du-matuto-bar-cozinha-agua-boa | Du Matuto Bar & Cozinha | @dumatuto
- espetinho-do-jorge-agua-boa | Espetinho do Jorge | @espetinhodojorgeab
- frutos-de-goias-agua-boa-agua-boa | Frutos de Goiás Água Boa | @frutosdegoiasaguaboa
- galeria-espeto-agua-boa | Galeria Espeto | @galeria_espeto
- golden-hamburgueria-agua-boa | Golden Hamburgueria | @goldenhamburgueriaab
- jah-acai-e-sorvetes-agua-boa | Jah Açaí e Sorvetes | @jah_aguaboa
- karamello-s-confeitaria-cafe-agua-boa | Karamello's Confeitaria & Café | @karamellosab
- la-casa-de-acai-agua-boa | La Casa de Açaí | @lacasadeacaiab
- lanchonete-e-sorveteria-rodoviaria-agua-boa | Lanchonete Rodoviária | @lanchonete_rodoviariaab
- ms-espeto-burguer-grill-agua-boa | Ms Espeto & Burguer Grill | @msespertoeburguergrillab
- o-grego-lanches-agua-boa | O Grego Lanches | @ogrego_lanches
- restaurante-alecrim-agua-boa | Restaurante Alecrim | @restaurante_alecrimab

## Novo São Joaquim (3)
- beliskos-lanchonete-e-restaurante-novo-sao-joaquim | Beliskos Lanchonete e Restaurante | @beliskos_lanchonete_beliskos_
- creme-mania-sorvetes-novo-sao-joaquim | Creme Mania Sorvetes | @creme_maniasorvetesnsj
- mayhara-cakes-novo-sao-joaquim | Mayhara Cakes | @mayhara.cakes

## Campinápolis (1)
- eclipse-lanchonete-e-pizzaria-campinapolis | Eclipse Lanchonete e Pizzaria | @eclipse.lanchonete

## Nova Xavantina (19)
- acai-raiz-do-para-nova-xavantina | Açaí Raiz do Pará | @souacairaiz
- burguer-s-house-gourmet-nova-xavantina | Burguer's House Gourmet | @burguershouse_nx
- casa-do-espeto-nova-xavantina | Casa do Espeto | @casadoespetonx
- celeiro-panificadora-e-confeitaria-nova-xavantina | Celeiro Panificadora e Confeitaria | @celeiropanificadoranx
- forja-burguer-nova-xavantina | Forja Burguer | @forjaburguer_nxa
- frescor-acaiteria-nova-xavantina | Frescor Açaiteria | @frescoracaiterianx
- gran-pizza-nova-xavantina | Gran Pizza | @granpizzanx
- lanchonete-e-chopp-do-luizao-nova-xavantina | Lanchonete e Chopp do Luizão | @lanchonete__e_chopp_do_luizao
- magnifico-hot-dog-nx-nova-xavantina | Magnífico Hot Dog NX | @magnificohotdognx
- maia-s-brigadeiria-artesanal-nova-xavantina | Maia's Brigadeiria Artesanal | @maiasbrigadeiriaartesanal
- nexy-acai-nova-xavantina | Nexy Açaí | @nexyacai
- nt-distribuidora-nova-xavantina | NT Distribuidora | @nt_distribuidorabeer
- oishi-sushi-nova-xavantina-nova-xavantina | Oishi Sushi Nova Xavantina | @oishisushinx
- pizza-grill-delivery-nova-xavantina | Pizza Grill Delivery | @pizza_grilldelivery
- pizzaria-gaucha-nova-xavantina | Pizzaria Gaúcha | @pizzariagaucha
- pizzaria-sinal-verde-nova-xavantina | Pizzaria Sinal Verde | @pizzaria_sinal_verde
- portal-burguer-grill-nova-xavantina | Portal Burguer & Grill | @portalburguergril
- the-best-acai-nova-xavantina | The Best Açaí | @franqueado_the_best_acai_nx
- tribo-do-acai-nova-xavantina | Tribo do Açaí | @tribodoacainx

## Barra do Garças (15)
- ana-docura-confeitaria-barra-do-garcas | Ana Doçura Confeitaria | @ana.docura
- cheff-do-espeto-barra-do-garcas | Cheff do Espeto | @cheffdoespeto_
- churrascaria-o-panelao-barra-do-garcas | Churrascaria O Panelão | @opanelaochurrascaria
- doces-da-ana-barra-do-garcas | Doces da Ana | @docesdaanabg
- emporio-pizzaria-barra-barra-do-garcas | Empório Pizzaria Barra | @emporiopizzariabarra
- frutos-de-goias-sorveteria-barra-do-garcas | Frutos de Goiás Sorveteria | @frutosdegoiasbgoficial
- jose-lanches-barra-do-garcas | José Lanches | @jose_lanches_bg
- leo-pasteis-saltenhas-barra-do-garcas | Léo Pastéis & Saltenhas | @pastelariadoleobg
- marmitaria-da-barra-barra-do-garcas | Marmitaria da Barra | @marmitariadabarra
- mistro-massas-marmitas-pizzaria-barra-do-garcas | Mistrô Massas Marmitas & Pizzaria | @mistromassasoficial
- pizzaria-sabor-carioca-barra-do-garcas | Pizzaria Sabor Carioca | @pizzariasaborcariocabg
- ponto-do-acai-barra-do-garcas | Ponto do Açaí | @acaipontobg
- restaurante-buteco-do-bicudo-barra-do-garcas | Restaurante Buteco do Bicudo | @butecodobicudobg
- sushi-loko-barra-do-garcas-barra-do-garcas | Sushi Loko Barra do Garças | @sushilokomt
- zhu-marmitas-shopping-barra-do-garcas-barra-do-garcas | Zhu Marmitas - Shopping Barra do Garças | @zhu.marmitas

## Lojas sem @ no nosso cadastro (procure no Instagram por nome + cidade; se achar, anote o @ em "perfil" e siga o mesmo fluxo)

### Vila Rica (13)
- chambari-e-espetinho-do-dede-vila-rica | Chambari e Espetinho do Dedé
- churrascaria-e-lanchonete-central-vila-rica | Churrascaria e Lanchonete Central
- churrascaria-silva-vila-rica | Churrascaria Silva
- ezequiel-restaurante-e-pizzaria-vila-rica | Ezequiel Restaurante e Pizzaria
- lanchonete-valtenes-vila-rica | Lanchonete Valtenes
- padaria-e-confeitaria-alvorada-vila-rica | Padaria e Confeitaria Alvorada
- panificadora-e-lanchonete-sabor-de-minas-vila-rica | Panificadora e Lanchonete Sabor de Minas
- panificadora-fruto-do-trigo-vila-rica | Panificadora Fruto do Trigo
- rei-da-marmita-vila-rica | Rei da Marmita
- restaurante-e-espetinho-chico-anizio-vila-rica | Restaurante e Espetinho Chico Anizio
- restaurante-file-do-brasil-vila-rica | Restaurante Filé do Brasil
- restaurante-passe-bem-vila-rica | Restaurante Passe Bem
- villa-chopp-vila-rica | Villa Chopp

### São Félix do Araguaia (17)
- bar-e-restaurante-gaivota-sao-felix-do-araguaia | Bar e Restaurante Gaivota
- baroni-burger-sao-felix-do-araguaia | Baroni Burger
- beef-point-sao-felix-do-araguaia | Beef Point
- churrascaria-araguaia-sao-felix-do-araguaia | Churrascaria Araguaia
- delicias-pizzas-sao-felix-do-araguaia | Delícias Pizzas
- di-casa-da-brasa-marmitaria-sao-felix-do-araguaia | Di Casa da Brasa Marmitaria
- dubai-pizzaria-sao-felix-do-araguaia | Dubai Pizzaria
- dubay-lanches-sao-felix-do-araguaia | Dubay Lanches
- espeto-cia-sao-felix-do-araguaia | Espeto & Cia
- panificadora-e-lanchonete-ki-delicia-sao-felix-do-araguaia | Panificadora e Lanchonete Ki-Delícia
- pizza-e-espeto-lider-sao-felix-do-araguaia | Pizza e Espeto Líder
- pizzaria-casa-da-sogra-sao-felix-do-araguaia | Pizzaria Casa da Sogra
- pizzaria-do-pakotinho-sao-felix-do-araguaia | Pizzaria do Pakotinho
- restaurante-agua-na-boca-sao-felix-do-araguaia | Restaurante Água na Boca
- restaurante-do-jean-sao-felix-do-araguaia | Restaurante do Jean
- restaurante-encontro-das-aguas-sao-felix-do-araguaia | Restaurante Encontro das Águas
- vitoria-lanchonete-e-pizzaria-sao-felix-do-araguaia | Vitória Lanchonete e Pizzaria

### Querência (6)
- churrascaria-da-familia-querencia | Churrascaria Da Família
- churrascaria-e-restaurante-quintal-festas-querencia | Churrascaria e Restaurante Quintal Festas
- churrascaria-retiros-rocha-querencia | Churrascaria Retiros Rocha
- lanchonete-e-restaurante-mega-querencia | Lanchonete e Restaurante Mega
- m-m-restaurante-querencia | M&M Restaurante
- sabor-de-verao-querencia | Sabor de Verão

### Ribeirão Cascalheira (17)
- carnes-petiscos-bar-s-ribeirao-cascalheira | Carnes & Petiscos Bar's
- jatobars-lanchonete-restaurante-bar-ribeirao-cascalheira | Jatobars Lanchonete Restaurante Bar
- jeriva-hotel-lanchonete-ribeirao-cascalheira | Jeriva Hotel & Lanchonete
- k-delicia-ribeirao-cascalheira | K'delicia
- lanchonete-e-restaurante-rodoviario-ribeirao-cascalheira | Lanchonete e Restaurante Rodoviário
- lanchonete-xingu-ribeirao-cascalheira | Lanchonete Xingu
- panificadora-mana-ribeirao-cascalheira | Panificadora Mana
- panificadora-novo-sabor-ribeirao-cascalheira | Panificadora Novo Sabor
- panificadora-sabor-do-povo-ribeirao-cascalheira | Panificadora Sabor do Povo
- rei-do-lanche-mt-ribeirao-cascalheira | Rei do Lanche MT
- restaurante-e-churrascaria-serve-bem-ribeirao-cascalheira | Restaurante e Churrascaria Serve Bem
- restaurante-nossa-senhora-de-fatima-ribeirao-cascalheira | Restaurante Nossa Senhora de Fátima
- restaurante-seu-lucio-ribeirao-cascalheira | Restaurante Seu Lucio
- rocha-restaurante-e-lanchonete-ribeirao-cascalheira | Rocha Restaurante e Lanchonete
- sorveteria-lanchonete-gelo-doce-ribeirao-cascalheira | Sorveteria & Lanchonete Gelo Doce
- sorveteria-betel-ribeirao-cascalheira | Sorveteria Betel
- sorveteria-vitoria-ribeirao-cascalheira | Sorveteria Vitoria

### Canarana (11)
- cantinho-da-familia-canarana | Cantinho da Família
- imperio-do-acai-canarana | Império do Açaí
- ketsui-sushi-restaurante-japones-canarana | Ketsui Sushi Restaurante Japonês
- lanchonete-degus-t-canarana | Lanchonete Degus'T
- panificadora-trigomel-canarana | Panificadora Trigomel
- parada-obrigatoria-burguer-canarana | Parada Obrigatória Burguer
- pastelaria-do-grima-canarana | Pastelaria do Grima
- pastelaria-e-pizzaria-mexicana-canarana | Pastelaria e Pizzaria Mexicana
- primus-pizzaria-canarana | Primus Pizzaria
- restaurante-e-lanchonete-kalifa-s-canarana | Restaurante e Lanchonete Kalifa's
- restaurante-zero-grau-canarana | Restaurante Zero Grau

### Água Boa (1)
- restaurante-martinao-agua-boa | Restaurante Martinão

### Novo São Joaquim (9)
- acai-delivery-novo-sao-joaquim | Açaí Delivery
- brancos-lanchonete-e-sorveteria-novo-sao-joaquim | Brancos Lanchonete e Sorveteria
- fran-pizzaria-e-doceria-novo-sao-joaquim | Fran Pizzaria e Doceria
- lanchonete-e-restaurante-vereda-tropical-novo-sao-joaquim | Lanchonete e Restaurante Vereda Tropical
- lanchonete-salgado-filho-novo-sao-joaquim | Lanchonete Salgado Filho
- panificadora-sonho-vivo-novo-sao-joaquim | Panificadora Sonho Vivo
- pizzaria-napolitana-novo-sao-joaquim | Pizzaria Napolitana
- pizzaria-paladar-novo-sao-joaquim | Pizzaria Paladar
- skinao-lanchonete-e-restaurante-novo-sao-joaquim | Skinão Lanchonete e Restaurante

### Campinápolis (7)
- buffalos-grill-campinapolis | Buffalos Grill
- la-paraguaya-restaurante-e-pizzaria-campinapolis | La Paraguaya Restaurante e Pizzaria
- panificadora-pao-dourado-campinapolis | Panificadora Pão Dourado
- pastelaria-e-lanchonete-predileta-campinapolis | Pastelaria e Lanchonete Predileta
- pizzaria-ponto-livre-campinapolis | Pizzaria Ponto Livre
- restaurante-casa-da-vovo-campinapolis | Restaurante Casa da Vovó
- sorveteria-maranata-campinapolis | Sorveteria Maranata

### Nova Xavantina (1)
- palladar-restaurante-e-pizzaria-nova-xavantina | Palladar Restaurante e Pizzaria

### Barra do Garças (1)
- texas-grill-burger-churrasco-barra-do-garcas | Texas Grill - Burger & Churrasco
