{/* GALLERY DINAMICA - STYLE MASONRY */}
<section id="gallery" className="mx-auto max-w-7xl px-6 sm:px-10 py-16">
    <div className="flex items-end justify-between mb-10">
        <div>
            <p className="overline">Galleria</p>
            <h2 className="font-display text-4xl text-lake-ink mt-3">Gli spazi</h2>
        </div>
    </div>

    {images.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-lake-border">
            <ImageIcon className="mx-auto text-lake-ink/20 mb-4" size={48} />
            <p className="text-lake-ink/50 italic">Caricamento immagini...</p>
        </div>
    ) : (
        /* Il trucco è "columns-1" per mobile, "columns-2" per tablet e "columns-3" per desktop */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {images.map((img, index) => (
                <div 
                    key={img.id || index} 
                    className="break-inside-avoid overflow-hidden rounded-sm shadow-sm group bg-lake-sand"
                >
                    <img 
                        src={img.url} 
                        alt={img.caption || "Galleria"} 
                        /* Rimuoviamo l'altezza fissa: ogni foto manterrà la sua proporzione naturale */
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {img.caption && (
                        <div className="p-3 bg-white border-t border-lake-border">
                            <p className="text-[10px] uppercase tracking-widest text-lake-blue font-semibold">{img.category}</p>
                            <p className="text-xs text-lake-ink/70 italic">{img.caption}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )}
</section>
