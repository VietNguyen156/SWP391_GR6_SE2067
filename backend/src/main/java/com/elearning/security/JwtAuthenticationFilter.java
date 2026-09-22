package com.elearning.security;
import com.elearning.user.*;
import jakarta.servlet.*; import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService; private final UserRepository users;
    public JwtAuthenticationFilter(JwtService jwtService,UserRepository users){this.jwtService=jwtService;this.users=users;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException{
        String h=req.getHeader("Authorization");
        if(h!=null && h.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication()==null){
            try{
                String email=jwtService.extractEmail(h.substring(7));
                users.findByEmailIgnoreCase(email).filter(u->u.getStatus()==UserStatus.ACTIVE).ifPresent(u->{
                    var auth=new UsernamePasswordAuthenticationToken(u.getEmail(),null,
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_"+u.getRole().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }catch(Exception ignored){}
        }
        chain.doFilter(req,res);
    }
}
