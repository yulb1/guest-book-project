package com.example.guestbook.controller;

import com.example.guestbook.domain.Guestbook;
import com.example.guestbook.repository.GuestbookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guestbooks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GuestbookController {

    private final GuestbookRepository guestbookRepository;

    // 1. 목록 조회 (Read)
    @GetMapping
    public List<Guestbook> list() {
        return guestbookRepository.findAllByOrderByCreatedAtDesc();
    }

    // 2. 등록 (Create)
    @PostMapping
    public Guestbook create(@RequestBody Guestbook guestbook) {
        return guestbookRepository.save(guestbook);
    }
}