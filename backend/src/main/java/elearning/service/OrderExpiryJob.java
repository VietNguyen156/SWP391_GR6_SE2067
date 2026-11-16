package elearning.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** 10 phút/lần: đơn PENDING quá hạn → EXPIRED (qua OrderService để có transaction và lịch sử). */
@Component
public class OrderExpiryJob {
    private static final Logger log = LoggerFactory.getLogger(OrderExpiryJob.class);
    private final OrderService orders;

    public OrderExpiryJob(OrderService orders) {
        this.orders = orders;
    }

    @Scheduled(fixedDelay = 10 * 60 * 1000L, initialDelay = 60 * 1000L)
    public void run() {
        int expired = orders.expireOverdue();
        if (expired > 0) log.info("Đã chuyển {} đơn quá hạn sang EXPIRED", expired);
    }
}
