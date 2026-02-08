Flujo para el Usuario (Studio/Game Owner)

1. Añadir dominio  


- Va a Settings → Domains (studio) o Game → Settings (game)
- Escribe su dominio (ej: mystudio.com)
- Click en Add Domain  


2. Configurar DNS (manual en su proveedor)  


Al añadir el dominio, se expande un panel con instrucciones. El usuario  
 debe ir a su proveedor DNS (Cloudflare, GoDaddy, Namecheap, etc.) y añadir:

Record 1 - TXT (verificación):  
 Host: \_playlink-verification.mystudio.com  
 Value: playlink-verify-abc123xyz... (token generado)

Record 2 - CNAME (tráfico):  
 Host: mystudio.com  
 Target: custom.play.link

3. Verificar (un click)  


- Click en Verify DNS
- El sistema automáticamente:  
  a. Consulta DNS de Google para verificar el TXT record  
  b. Si es correcto, crea el Custom Hostname en Cloudflare (SSL automático)
  c. Marca el dominio como "verified"  


4. Listo  


Una vez verificado, cuando alguien visita mystudio.com, el Worker detecta  
 el hostname, busca en la DB, y renderiza la página correcta.

---

Lo que TÚ necesitas hacer (una sola vez)

1. Ejecutar la migración SQL
2. Configurar los secrets de Cloudflare en el API worker:  
   cd apps/api  
   wrangler secret put CF_ZONE_ID # Tu Zone ID de play.link  
   wrangler secret put CF_API_TOKEN # Token con permisos de Custom Hostnames
3. Crear el CNAME custom.play.link apuntando al worker de apps/web  


Sin estos secrets, la verificación DNS funcionará pero no se creará el  
 Custom Hostname en Cloudflare (el dominio quedará "verified" pero sin SSL  
 de Cloudflare).
